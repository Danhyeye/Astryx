import {authorizeRequest} from '@/lib/auth';
import {imageStoragePath, protectedImageUrl} from '@/lib/imageAccess';
import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ApiResponse } from "@/types/api-response";

const BUCKET = "land-images";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export async function GET(request: NextRequest) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
  const path = imageStoragePath(request.nextUrl.searchParams.get('path') ?? '');
  if (!path) return NextResponse.json({message: 'Đường dẫn không hợp lệ.'}, {status: 400});
  const {data, error} = await createAdminClient().storage.from(BUCKET).download(path);
  if (error) return NextResponse.json({message: 'Không tìm thấy hình ảnh.'}, {status: 404});
  return new Response(data, {headers: {
    'Content-Type': data.type || 'application/octet-stream',
    'Cache-Control': 'private, no-store',
    'X-Content-Type-Options': 'nosniff',
    'Content-Security-Policy': "default-src 'none'; sandbox",
  }});
}

type UploadedImage = {
  url: string;
  path: string;
};

// Detect real image type from file bytes (magic numbers) — ignores
// client-supplied Content-Type and filename entirely.
async function detectImageType(
  buffer: ArrayBuffer
): Promise<{ mime: string; ext: string } | null> {
  const bytes = new Uint8Array(buffer.slice(0, 12));

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg" };
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return { mime: "image/png", ext: "png" };
  }

  // WEBP: "RIFF" .... "WEBP"
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return { mime: "image/webp", ext: "webp" };
  }

  return null;
}

export async function POST(request: NextRequest) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json<ApiResponse<null>>(
      { code: 400, message: "Dữ liệu biểu mẫu không hợp lệ", data: null },
      { status: 400 }
    );
  }

  const files = formData
    .getAll("images")
    .filter((f): f is File => f instanceof File);

  if (files.length === 0) {
    return NextResponse.json<ApiResponse<null>>(
      { code: 400, message: "Chưa chọn hình ảnh", data: null },
      { status: 400 }
    );
  }

  // Read + validate all files up front (by content, not by claimed type)
  const buffers: { file: File; buffer: ArrayBuffer; mime: string; ext: string }[] = [];

  for (const file of files) {
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json<ApiResponse<null>>(
        { code: 400, message: `Tệp vượt quá dung lượng cho phép: ${file.name}`, data: null },
        { status: 400 }
      );
    }

    const buffer = await file.arrayBuffer();
    const detected = await detectImageType(buffer);

    if (!detected) {
      return NextResponse.json<ApiResponse<null>>(
        {
          code: 400,
          message: `Định dạng ảnh không được hỗ trợ: ${file.name}`,
          data: null,
        },
        { status: 400 }
      );
    }

    buffers.push({ file, buffer, mime: detected.mime, ext: detected.ext });
  }

  const supabase = createAdminClient();
  const uploaded: UploadedImage[] = [];

  for (const { buffer, mime, ext } of buffers) {
    const path = `uploads/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: mime, upsert: false });

    if (uploadError) {
      return NextResponse.json<ApiResponse<null>>(
        { code: 500, message: uploadError.message, data: null },
        { status: 500 }
      );
    }

    uploaded.push({ url: protectedImageUrl(path), path });
  }

  return NextResponse.json<ApiResponse<UploadedImage[]>>(
    { code: 201, message: "Đã tải lên", data: uploaded },
    { status: 201 }
  );
}

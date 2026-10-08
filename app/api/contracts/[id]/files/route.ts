import {authorizeRequest} from '@/lib/auth';
import {NextResponse} from 'next/server';
import {createAdminClient} from '@/lib/supabase/admin';
import {CONTRACT_FILE_BUCKET, MAX_CONTRACT_FILE_SIZE, detectContractFile, contractFileName} from '@/lib/contractFiles';

type Context = {params: Promise<{id: string}>};
const fail = (message: string, status = 400) => NextResponse.json({message, data:null}, {status});

async function getContract(context: Context) {
  const {id} = await context.params;
  if (!/^[0-9a-f]{8}(-[0-9a-f]{4}){3}-[0-9a-f]{12}$/i.test(id)) return null;
  const supabase = createAdminClient();
  const {data, error} = await supabase.from('contracts').select('id').eq('id',id).maybeSingle();
  if (error) throw error;
  return data ? {id, supabase} : null;
}

export async function GET(request: Request, context: Context) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
  try {
    const contract = await getContract(context);
    if (!contract) return fail('Không tìm thấy hợp đồng.',404);
    const {id,supabase} = contract;
    const bucket = supabase.storage.from(CONTRACT_FILE_BUCKET);
    const path = new URL(request.url).searchParams.get('path');
    if (path) {
      if (!path.startsWith(id + '/') || path.slice(id.length + 1).includes('/') || path.includes('..')) return fail('Đường dẫn tệp không hợp lệ.');
      const {data,error} = await bucket.createSignedUrl(path, 60, {download:path.split('/').at(-1)?.slice(37)});
      if (error) return fail('Không thể tải tệp hợp đồng.',404);
      return NextResponse.redirect(data.signedUrl);
    }
    const files = [];
    for (let offset=0; ; offset+=100) {
      const {data,error} = await bucket.list(id,{limit:100,offset,sortBy:{column:'name',order:'asc'}});
      if (error) throw error;
      files.push(...data.filter(file=>file.id).map(file=>({
        name:file.name.slice(37), path:id + '/' + file.name,
        size:file.metadata?.size ?? 0, createdAt:file.created_at,
      })));
      if (data.length<100) break;
    }
    return NextResponse.json({data:files});
  } catch {
    return fail('Không thể tải danh sách tệp hợp đồng.',500);
  }
}

export async function POST(request: Request, context: Context) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
  try {
    const contract = await getContract(context);
    if (!contract) return fail('Không tìm thấy hợp đồng.',404);
    const form = await request.formData().catch(()=>null);
    const files = form?.getAll('files').filter((file): file is File => file instanceof File) ?? [];
    if (!files.length || files.length>5) return fail('Chọn từ 1 đến 5 tệp PDF hoặc DOCX.');
    const validated = [];
    for (const file of files) {
      if (!file.size || file.size>MAX_CONTRACT_FILE_SIZE) return fail('Mỗi tệp phải có dung lượng từ 1 byte đến 10 MB.');
      const bytes = new Uint8Array(await file.arrayBuffer());
      const mime = detectContractFile(bytes,file.name);
      if (!mime) return fail('Chỉ chấp nhận tệp PDF hoặc DOCX hợp lệ.');
      validated.push({bytes,mime,name:contractFileName(file.name)});
    }
    const bucket = contract.supabase.storage.from(CONTRACT_FILE_BUCKET);
    const uploaded: string[] = [];
    for (const file of validated) {
      const path = contract.id + '/' + crypto.randomUUID() + '_' + file.name;
      const {error} = await bucket.upload(path,file.bytes,{contentType:file.mime,upsert:false});
      if (error) {
        if (uploaded.length) await bucket.remove(uploaded);
        return fail('Hợp đồng đã lưu nhưng tải tệp thất bại. Vui lòng thử lại.',500);
      }
      uploaded.push(path);
    }
    return NextResponse.json({data:uploaded,message:'Đã tải tệp hợp đồng.'},{status:201});
  } catch {
    return fail('Không thể tải tệp hợp đồng lên. Vui lòng thử lại.',500);
  }
}


export async function DELETE(request: Request, context: Context) {
  const denied = await authorizeRequest(request);
  if (denied) return denied;
  try {
    const contract = await getContract(context);
    if (!contract) return fail('Không tìm thấy hợp đồng.',404);
    const body = await request.json().catch(() => null);
    const path = body?.path;
    if (typeof path !== 'string' || !path.startsWith(contract.id + '/') ||
        !path.slice(contract.id.length + 1) || path.slice(contract.id.length + 1).includes('/') ||
        path.includes('..') || path.includes('\\')) {
      return fail('Đường dẫn tệp không hợp lệ.');
    }
    const {error} = await contract.supabase.storage.from(CONTRACT_FILE_BUCKET).remove([path]);
    if (error) return fail('Không thể xóa tệp hợp đồng. Vui lòng thử lại.',500);
    return NextResponse.json({data:null,message:'Đã xóa tệp hợp đồng.'});
  } catch {
    return fail('Không thể xóa tệp hợp đồng. Vui lòng thử lại.',500);
  }
}

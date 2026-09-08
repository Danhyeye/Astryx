export type ContractFile = {name:string;path:string;size:number;createdAt:string};

export async function uploadContractFiles(id: string, files: File[]) {
  if (!files.length) return;
  const body = new FormData();
  files.forEach(file => body.append('files',file));
  const response = await fetch('/api/contracts/' + id + '/files',{method:'POST',body});
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? 'Không thể tải tệp hợp đồng.');
}

export async function fetchContractFiles(id: string): Promise<ContractFile[]> {
  const response = await fetch('/api/contracts/' + id + '/files');
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? 'Không thể tải danh sách tệp.');
  return result.data;
}


export async function deleteContractFile(id: string, path: string) {
  const response = await fetch('/api/contracts/' + id + '/files', {
    method:'DELETE',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({path}),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? 'Không thể xóa tệp hợp đồng.');
}

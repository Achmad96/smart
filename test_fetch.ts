async function main() {
  const url = "https://rdjyvuggnxrglnaspaeg.supabase.co/storage/v1/object/public/templates/1784326256666_BPNTN.docx";
  const res = await fetch(url);
  console.log("Status:", res.status);
  console.log("Headers:", Object.fromEntries(res.headers.entries()));
  if (!res.ok) {
    const text = await res.text();
    console.log("Error body:", text);
  } else {
    console.log("Success! Content length:", (await res.arrayBuffer()).byteLength);
  }
}
main();

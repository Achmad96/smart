const textBefore = "This is a long document... \n\n Kepala Desa \n\n Nama \n\n : \n\n ";
const tail = textBefore.substring(Math.max(0, textBefore.length - 150));
const labelMatch = tail.match(/([A-Za-z0-9_/, -]+?)[\s]*:?[\s]*$/);
console.log(labelMatch);

import { PDFDocument } from 'pdf-lib';

export interface PDFFormField {
  name: string;
  type: 'text' | 'checkbox' | 'radio' | 'dropdown' | 'button';
  required?: boolean;
}

/**
 * Extracts form fields from an uploaded PDF file
 */
export async function extractPDFFormFields(file: File): Promise<PDFFormField[]> {
  const arrayBuffer = await file.arrayBuffer();
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  
  const form = pdfDoc.getForm();
  const fields = form.getFields();
  
  return fields.map(field => {
    let type: PDFFormField['type'] = 'text';
    const fieldType = field.constructor.name;
    
    if (fieldType.includes('TextField')) type = 'text';
    else if (fieldType.includes('CheckBox')) type = 'checkbox';
    else if (fieldType.includes('RadioGroup')) type = 'radio';
    else if (fieldType.includes('Dropdown')) type = 'dropdown';
    else if (fieldType.includes('Button')) type = 'button';
    
    return {
      name: field.getName(),
      type,
    };
  });
}

/**
 * Fills a PDF form with the provided values and returns the flattened PDF as a blob URL
 */
export async function fillPDFForm(file: File | ArrayBuffer, values: Record<string, string>): Promise<string> {
  let arrayBuffer: ArrayBuffer;
  if (file instanceof File) {
    arrayBuffer = await file.arrayBuffer();
  } else {
    arrayBuffer = file;
  }
  
  const pdfDoc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  const form = pdfDoc.getForm();
  
  // Fill the fields
  for (const [key, value] of Object.entries(values)) {
    try {
      const field = form.getField(key);
      if (field) {
        if (field.constructor.name.includes('TextField')) {
          form.getTextField(key).setText(value || '');
        } else if (field.constructor.name.includes('CheckBox')) {
          if (value === 'true' || value === 'on' || value === 'yes') {
            form.getCheckBox(key).check();
          } else {
            form.getCheckBox(key).uncheck();
          }
        } else if (field.constructor.name.includes('Dropdown')) {
          form.getDropdown(key).select(value);
        }
      }
    } catch (err) {
      console.warn(`Could not fill field ${key}:`, err);
    }
  }
  
  // Flatten the form so it becomes uneditable text part of the PDF layout
  form.flatten();
  
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  return URL.createObjectURL(blob);
}

// new.js
document.getElementById('realEstateForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('title').value;
  const price = document.getElementById('price').value;
  const description = document.getElementById('description').value;
  const bedrooms = document.getElementById('bedrooms').value;
  const bathrooms = document.getElementById('bathrooms').value;
  const area = document.getElementById('area').value;
  const agent = document.getElementById('agent').value;
  const imageFiles = document.getElementById('image').files;
  const titleImageFiles = document.getElementById('titleImage').files;
  const propertyCategory = document.getElementById('propertyCategory').value;
  // สร้าง FormData เพื่อส่งข้อมูล
  const formData = new FormData();
  formData.append('title', title);
  formData.append('price', price);
  formData.append('description', description);
  formData.append('bedrooms', bedrooms);
  formData.append('bathrooms', bathrooms);
  formData.append('area', area);
  formData.append('agent', agent);
  formData.append('propertyCategory', propertyCategory);
  // ถ้ามี titleImage ให้แนบไปกับ FormData
  if (titleImageFiles.length > 0) {

    const originalFileName = titleImageFiles[0].name; // ชื่อไฟล์ต้นฉบับ
    // const fileExtension = originalFileName.split('.').pop(); // หรือใช้
    // const newFileName = "title_"+ title+"."+fileExtension; // เปลี่ยนชื่อไฟล์

    const newFileName = "title_"+ originalFileName; // เปลี่ยนชื่อไฟล์
    const newFile = new File([titleImageFiles[0]], newFileName, { type: titleImageFiles[0].type }); // สร้างไฟล์ใหม่
    formData.append('titleImage', newFile); // แนบไฟล์ titleImage ตัวใหม่
  }

  if (imageFiles.length > 0) {
    for (let i = 0; i < imageFiles.length; i++) {
        const file = imageFiles[i];
        // const fileExtension = file.name.split('.').pop(); // หรือใช้
        // // สร้างชื่อใหม่ให้กับไฟล์
        // const newFileName = title + "_"+i+"."+fileExtension;


        // สร้างชื่อใหม่ให้กับไฟล์
        const newFileName = i+"_"+ file.name;
        
        // สร้าง Blob ใหม่ด้วยชื่อใหม่
        const renamedFile = new File([file], newFileName, { type: file.type });

        formData.append('images[]', renamedFile); // แนบไฟล์ที่มีชื่อใหม่ไปกับ FormData
    }
  }
  try {
    const response = await fetch('/api/insertProperty', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    alert('ADD Property Successfully!');
    resetRealEstateForm();  // ล้างฟอร์ม
  } catch (error) {
    console.error('Error:', error);
  }
});

function resetRealEstateForm() {
  document.getElementById('realEstateForm').reset();
}
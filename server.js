const express = require('express');
const path = require('path');
const { getData, insertUser, login, insertProperty,getAllProperties,getPropertyById ,updateProperty, deletePropertyFromDB,getDataByCategory,getDataBySearch} = require('./assets/js/fire-store-DB.js'); // ดึงฟังก์ชัน getData จาก fire-store-DB.js
const session = require('express-session');
// ตั้งค่า multer สำหรับการอัปโหลดไฟล์
const multer = require('multer');
const fs = require('fs');

const app = express();
const port = 3000;

const cors = require('cors');
// ใช้ middleware นี้สำหรับ parsing JSON
app.use(express.json());
app.use(cors()); // ถ้าจำเป็นต้องใช้ CORS
// Serve static files (HTML, CSS, JS) from the main directory
app.use(express.static(__dirname)); // ให้บริการไฟล์จากโฟลเดอร์หลัก
// ตั้งค่า Session
app.use(session({
  secret: 'iHome168BackOffice',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 30 * 60 * 1000 // 30 minutes in milliseconds
  }
}));


// ตั้งค่า multer สำหรับการอัปโหลดไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = './assets/images/property'; // กำหนดโฟลเดอร์ที่จะเก็บไฟล์
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true }); // สร้างโฟลเดอร์ถ้ายังไม่มี
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, file.originalname); // ใช้ชื่อไฟล์เดิม
  }
});

const upload = multer({ storage: storage });
// Endpoint สำหรับบันทึกข้อมูลอสังหาริมทรัพย์


// Endpoint to get data from Firestore
app.get('/api/getData', async (req, res) => {
  try {
    const data = await getData('property-list'); // ดึงข้อมูลจาก collection 'property-list'
    res.json(data); // ส่งข้อมูลกลับในรูปแบบ JSON
  } catch (error) {
    console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
    res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
  }
});
app.post('/api/insertUser', async (req, res) => {
  const { firstName, lastName, dateOfBirth, gender, phoneNumber, email, password } = req.body;

  try {
    // เรียกใช้ฟังก์ชัน insertUser
    const result = await insertUser(firstName, lastName, dateOfBirth, gender, phoneNumber, email, password);

    if (result.success) {
      res.status(200).json({ success: true, message: 'User inserted successfully', docId: result.docId });
    } else {
      res.status(500).json({ success: false, message: 'Error inserting user data.' });
    }
  } catch (error) {
    console.error('Error handling form submission:', error);
    res.status(500).json({ success: false, message: 'An error occurred.' });
  }
});
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await login(email, password);

    if (result.success) {
      //console.log(result);
      req.session.user = {
        email: result.user.email,
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      };

      res.status(200).json({ success: true, message: result.message, user: result.user });
    } else {
      res.status(401).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Error handling login request:', error);
    res.status(500).json({ success: false, message: 'An error occurred.' });
  }
});
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false, message: 'Could not log out.' });
    }
    res.status(200).json({ success: true, message: 'Logged out successfully.' });
  });
});
// ตัวอย่าง Route ที่ต้องตรวจสอบ Session
app.get('/api/protected', (req, res) => {
  if (req.session.user) {
    const duration = req.session.cookie.maxAge;
    res.status(200).json({ success: true, duration });
  } else {
    res.status(401).json({ success: false, message: 'Unauthorized' });
  }
});


app.get('/api/getAllProperty', async (req, res) => {
  try {
    const result = await getAllProperties(); // เรียกใช้ฟังก์ชัน getAllProperties

    if (result.success) {
      res.status(200).json({ success: true, properties: result.properties });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error('Error handling getAllProperty request:', error);
    res.status(500).json({ success: false, message: 'An error occurred.' });
  }
});
app.post('/api/getPropertyById', async (req, res) => {
  const { id } = req.body; // ดึง id จาก body ของ POST request
  try {
    const property = await getPropertyById(id); // ดึงข้อมูล property จาก Firestore
    if (property) {
      res.status(200).json({ success: true, property });
    } else {
      res.status(404).json({ success: false, message: 'Property not found' });
    }
  } catch (error) {
    console.error('Error fetching property details:', error);
    res.status(500).json({ success: false, message: 'An error occurred.' });
  }
});

app.post('/api/getPropertyByCategory', async (req, res) => { // เปลี่ยนจาก app.get เป็น app.post
  const { id } = req.body; // ดึง id จาก body ของ POST request
  try {
      const data = await getDataByCategory(id); // ดึงข้อมูลจาก collection 'property-list'
      res.json(data); // ส่งข้อมูลกลับในรูปแบบ JSON
  } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
      res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
  }
});

app.post('/api/getPropertyBySearch', async (req, res) => { // เปลี่ยนจาก app.get เป็น app.post
  const { title } = req.body;
  const { category } = req.body;

  //console.log("title : " + title +" , category : "+  category)
   // ดึง id จาก body ของ POST request
  try {
      const data = await getDataBySearch(title, category); // ดึงข้อมูลจาก collection 'property-list'
      res.json(data); // ส่งข้อมูลกลับในรูปแบบ JSON
  } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
      res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
  }
});


app.post('/api/insertProperty', upload.fields([{ name: 'images[]', maxCount: 10 }, { name: 'titleImage' }]), async (req, res) => {
  try {
    const { title, price, description, bedrooms, bathrooms, area, agent,propertyCategory } = req.body;
    const imageFileNames = req.files['images[]'] ? req.files['images[]'].map(file => file.filename) : []; // เก็บชื่อไฟล์ในรูปแบบอาร์เรย์
    const titleImageFileName = req.files['titleImage'] ? req.files['titleImage'][0].filename : null; // ชื่อไฟล์ titleImage

    // ดึง firstName จาก session
    const createdBy = req.session.user ? req.session.user.firstName : null;

    // เรียกใช้ฟังก์ชัน insertProperty ที่อยู่ใน fire-store-DB.js
    const result = await insertProperty(title, price, description, bedrooms, bathrooms, area, agent, imageFileNames, titleImageFileName, createdBy,propertyCategory);

    if (result.success) {
      res.status(201).json({ success: true, id: result.id });
    } else {
      res.status(500).json({ success: false, message: result.message });
    }
  } catch (error) {
    console.error("Error handling property submission: ", error);
    res.status(500).json({ success: false, message: 'Error handling property submission' });
  }
});


app.post('/api/updateProperty', upload.fields([{ name: 'images[]', maxCount: 10 }, { name: 'titleImage', maxCount: 1 }]), async (req, res) => {
  const { id, title, price, description, bedrooms, bathrooms, area, agent,propertyCategory,isPopular } = req.body;
  const imageFileNames = req.files['images[]'] ? req.files['images[]'].map(file => file.filename) : [];
  const titleImageFileName = req.files['titleImage'] ? req.files['titleImage'][0].filename : null; // ดึงชื่อไฟล์ titleImage

  // ดึง firstName จาก session
  const createdBy = req.session.user ? req.session.user.firstName : null;

  try {
      const result = await updateProperty(id, {
          title,
          price,
          description,
          bedrooms,
          bathrooms,
          area,
          agent,
          imageFileNames,
          titleImageFileName, // ส่งชื่อไฟล์ titleImage
          createdBy,
          propertyCategory,
          isPopular
      });

      res.status(200).json({ success: true, message: 'Property updated successfully', result });
  } catch (error) {
      console.error('Error in updateProperty API:', error);
      res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/deleteProperty/:id', async (req, res) => {
  const propertyId = req.params.id;

  try {
      const result = await deletePropertyFromDB(propertyId); // ฟังก์ชันลบจากฐานข้อมูล

      if (result.success) {
          res.status(200).json({ success: true, message: 'Property deleted successfully' });
      } else {
          res.status(500).json({ success: false, message: 'Failed to delete property' });
      }
  } catch (error) {
      console.error('Error deleting property:', error);
      res.status(500).json({ success: false, message: 'Error deleting property' });
  }
});


app.post('/api/getPropertyCount', async (req, res) => { // เปลี่ยนจาก app.get เป็น app.post
  //const { id } = req.body; // ดึง id จาก body ของ POST request
  try {
      const [data1, data2, data3] = await Promise.all([
        getDataByCategory("1"),
        getDataByCategory("2"),
        getDataByCategory("3")
      ]);

      // จัดการข้อมูลในรูปแบบที่ต้องการ
      const data = {
        category1: data1.length,
        category2: data2.length,
        category3: data3.length
      };
      res.json(data); // ส่งข้อมูลกลับในรูปแบบ JSON
  } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
      res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
  }
});

app.post('/api/getPopularProperty', async (req, res) => { // เปลี่ยนจาก app.get เป็น app.post

  //console.log("title : " + title +" , category : "+  category)
   // ดึง id จาก body ของ POST request
  try {
      const alldata = await getData('property-list');
      let  data = alldata;
      
      data = data.filter(property => property.isPopular);

      res.json(data); // ส่งข้อมูลกลับในรูปแบบ JSON
  } catch (error) {
      console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
      res.status(500).send('เกิดข้อผิดพลาดในการดึงข้อมูล');
  }
});


// Start server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});


// นำเข้า Firebase Admin SDK
const admin = require('firebase-admin');

// นำเข้าไฟล์คีย์ของ Service Account (ใส่ path ที่ถูกต้องของไฟล์ JSON)
const serviceAccount = require('D:/Sket/deck_project/amadavillas.com/assets/ihome1168backoffice-firebase-adminsdk-g8s0m-b21860e14b.json');

// กำหนดค่า Firebase Admin
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

// เข้าถึง Firestore
const db = admin.firestore();

// ฟังก์ชันในการดึงข้อมูลจาก Firestore
async function getData(collectionName = 'property-list') {
    try {
        const snapshot = await db.collection(collectionName).get();

        if (snapshot.empty) {
            console.log(`ไม่พบข้อมูลใน collection: ${collectionName}`);
            return;
        }

        const data = [];
        snapshot.forEach(doc => {
            data.push({ id: doc.id, ...doc.data() });
        });

        return data;
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
    }
}

// ฟังก์ชันสำหรับการ insert ข้อมูลลงใน collection 'authentication'
async function insertUser(firstName, lastName, dateOfBirth, gender, phoneNumber, email, password) {
    try {
        const docRef = await db.collection('authentication').add({
            firstName: firstName,
            lastName: lastName,
            dateOfBirth: dateOfBirth,
            gender: gender,
            phoneNumber: phoneNumber,
            email: email,
            password: password
        });
        // console.log('Document written with ID: ', docRef.id);
        return { success: true, message: 'Data inserted successfully', docId: docRef.id };
    } catch (error) {
        console.error('Error inserting document: ', error);
        return { success: false, message: 'Error inserting data', error: error };
    }
}
async function login(email, password) {
    try {
        // ค้นหาผู้ใช้ใน collection 'authentication' ตาม email
        const snapshot = await db.collection('authentication').where('email', '==', email).get();

        if (snapshot.empty) {
            return { success: false, message: 'No user found with this email.' };
        }

        let userFound = null;
        snapshot.forEach(doc => {
            userFound = { id: doc.id, ...doc.data() }; // ดึงข้อมูลผู้ใช้
            //console.log(userFound);
        });

        // ตรวจสอบ password (สมมติว่าคุณได้เก็บรหัสผ่านในรูปแบบที่เข้ารหัสหรือไม่)
        if (userFound.password === password) {
            return { success: true, message: 'Login successful', user: userFound };
        } else {
            return { success: false, message: 'Incorrect password.' };
        }

    } catch (error) {
        console.error('Error during login:', error);
        return { success: false, message: 'An error occurred during login.' };
    }
}



// ฟังก์ชันสำหรับการดึงข้อมูลอสังหาริมทรัพย์ทั้งหมดจาก collection 'property-list'
async function getAllProperties() {
    try {
      const snapshot = await db.collection('property-list').get();
      const properties = [];
  
      snapshot.forEach(doc => {
        properties.push({ id: doc.id, ...doc.data() }); // เก็บข้อมูลพร้อม ID ของเอกสาร
      });
  
      return { success: true, properties }; // ส่งข้อมูลกลับ
    } catch (error) {
      console.error('Error fetching properties: ', error);
      return { success: false, message: 'Error fetching properties' };
    }
  }
  async function getPropertyById(id) {
    try {
      const docSnap = await db.collection('property-list').doc(id).get();
  
      if (docSnap.exists) {
        return { id: docSnap.id, ...docSnap.data() };
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      throw new Error('Error fetching property');
    }
  }

    async function insertProperty(title, price, description, bedrooms, bathrooms, area, agent, imageFileNames, titleImageFileName, createdBy,propertyCategory) {
        try {
            const docRef = await db.collection('property-list').add({
                title,
                price,
                description,
                bedrooms,
                bathrooms,
                area,
                agent,
                imageFileNames, // บันทึกชื่อไฟล์ในรูปแบบอาร์เรย์
                titleImage: titleImageFileName, // บันทึกชื่อไฟล์ titleImage
                createdAt: admin.firestore.FieldValue.serverTimestamp(), // เพิ่ม timestamp
                createdBy,
                propertyCategory
            });
            return { success: true, id: docRef.id }; // ส่งกลับ ID ของเอกสารที่ถูกสร้าง
        } catch (error) {
            console.error('Error inserting document: ', error);
            return { success: false, message: 'Error inserting property data', error: error };
        }
    }

    // async function updateProperty(id, { title, price, description, bedrooms, bathrooms, area, agent, imageFileNames, titleImageFileName, createdBy,propertyCategory }) {
    //     const propertyRef = db.collection('property-list').doc(id);
    //     const updates = {
    //         title,
    //         price,
    //         description,
    //         bedrooms,
    //         bathrooms,
    //         area,
    //         agent,
    //         imageFileNames, // บันทึกชื่อไฟล์ภาพในรูปแบบอาร์เรย์
    //         titleImage: titleImageFileName, // บันทึกชื่อไฟล์ titleImage
    //         createdAt: admin.firestore.FieldValue.serverTimestamp(), // เพิ่ม timestamp
    //         createdBy,
    //         propertyCategory
    //     };
    
    //     await propertyRef.update(updates);
    //     return { success: true };
    // }
    async function updateProperty(id, { title, price, description, bedrooms, bathrooms, area, agent, imageFileNames, titleImageFileName, createdBy, propertyCategory,isPopular }) {
        const propertyRef = db.collection('property-list').doc(id);
        const updates = {};
    
        // ตรวจสอบและเพิ่มค่าใน updates เฉพาะเมื่อไม่เป็น null หรือ ""
        if (title) updates.title = title;
        if (price) updates.price = price;
        if (description) updates.description = description;
        if (bedrooms) updates.bedrooms = bedrooms;
        if (bathrooms) updates.bathrooms = bathrooms;
        if (area) updates.area = area;
        if (agent) updates.agent = agent;
        if (imageFileNames.length > 0) updates.imageFileNames = imageFileNames; // ตรวจสอบว่ามีภาพหรือไม่
        if (titleImageFileName) updates.titleImage = titleImageFileName; // ส่งเฉพาะชื่อไฟล์ที่มีค่า
        if (createdBy) updates.createdBy = createdBy;
        if (propertyCategory) updates.propertyCategory = propertyCategory;
        if (isPopular) updates.isPopular = isPopular;
        
        updates.createdAt = admin.firestore.FieldValue.serverTimestamp(); // เพิ่ม timestamp เสมอ
    
        // อัปเดตเฉพาะค่าใน updates
        await propertyRef.update(updates);
        return { success: true };
    }
    async function deletePropertyFromDB(propertyId) {
        const propertyRef = db.collection('property-list').doc(propertyId);
    
        try {
            await propertyRef.delete(); // ลบเอกสารจาก Firestore
            return { success: true };
        } catch (error) {
            console.error('Error deleting document: ', error);
            return { success: false };
        }
    }
    async function getDataByCategory(id) {
        const collectionName = 'property-list'; // กำหนดชื่อ collection
        try {
            const snapshot = await db.collection(collectionName)
                .where('propertyCategory', '==', id) // ใช้ where เพื่อกรองข้อมูลตาม propertyCategory
                .get();
    
            if (snapshot.empty) {
                console.log(`ไม่พบข้อมูลใน collection: ${collectionName} ที่มี propertyCategory = ${id}`);
                return []; // คืนค่าเป็นอาเรย์ว่างแทน
            }
    
            const data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });
    
            return data; // คืนค่าชุดข้อมูลที่ดึงได้
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
            return []; // คืนค่าเป็นอาเรย์ว่างแทนในกรณีเกิดข้อผิดพลาด
        }
    }  

    async function getDataBySearch(title, category) {
        const collectionName = 'property-list'; // กำหนดชื่อ collection
        
        //console.log("title : " + title + "   " + "category : " + category);
        
        try {
            const snapshot = await db.collection(collectionName).get();
    
            if (snapshot.empty) {
                console.log(`ไม่พบข้อมูลใน collection: ${collectionName}`);
                return []; // คืนค่าเป็นอาเรย์ว่างแทน
            }
    
            let  data = [];
            snapshot.forEach(doc => {
                data.push({ id: doc.id, ...doc.data() });
            });

            // กรองตาม title ถ้า title มีค่า
            if (title && title !== "") {
                data = data.filter(property => 
                    property.title.includes(title) // ใช้ includes เพื่อตรวจสอบว่า title มีข้อความที่ระบุ
                );
            }

            // กรองตาม category ถ้า category มีค่า
            if (category && category !== "") {
                data = data.filter(property => 
                    property.propertyCategory  === category // ตรวจสอบว่าหมวดหมู่ตรงกับที่ระบุ
                );
            }
    
            
    
            return data; // คืนค่าชุดข้อมูลที่ดึงได้
        } catch (error) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูล:', error);
            return []; // คืนค่าเป็นอาเรย์ว่างแทนในกรณีเกิดข้อผิดพลาด
        }
    }
    
    

  
module.exports = {
    getData,
    insertUser,
    login,
    insertProperty, // Export ฟังก์ชัน insertProperty
    getAllProperties,
    getPropertyById,
    updateProperty,
    deletePropertyFromDB,
    getDataByCategory,
    getDataBySearch
};

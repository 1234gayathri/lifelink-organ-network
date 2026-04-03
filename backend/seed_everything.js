
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const MY_HOSP_ID = 'b87d0103-8ff1-437d-9b55-9a0b14ade8f3';

async function seedEverything() {
  console.log('Seeding data for My Hospital...');

  // 1. User's Whitelisted Test Hospitals
  const bcrypt = require('bcrypt');
  const hashedG = await bcrypt.hash('gayathri8374', 12);
  const hashedC = await bcrypt.hash('charishma123', 12);

  const hashedP = await bcrypt.hash('pravallika66', 12);
  const hashedK = await bcrypt.hash('kalpana88', 12);

  await prisma.hospital.upsert({
    where: { officialEmail: 'rakotisaigayathri@gmail.com' },
    update: {},
    create: {
      hospitalName: 'GAYATHRI HOSPITAL',
      hospitalId: 'HOSP-GVP-001',
      officialEmail: 'rakotisaigayathri@gmail.com',
      contactPerson: 'Gayathri',
      phoneNumber: '9123456789',
      location: 'Visakhapatnam, AP',
      password: hashedG,
      verificationStatus: 'active'
    }
  });

  await prisma.hospital.upsert({
    where: { officialEmail: 'saicharishmajoga@gmail.com' },
    update: {},
    create: {
      hospitalName: 'CHARISHMA MEDICAL CENTER',
      hospitalId: 'HOSP-GVP-002',
      officialEmail: 'saicharishmajoga@gmail.com',
      contactPerson: 'Charishma',
      phoneNumber: '9123456788',
      location: 'Visakhapatnam, AP',
      password: hashedC,
      verificationStatus: 'active'
    }
  });

  await prisma.hospital.upsert({
    where: { officialEmail: 'pravallikaramu66@gmail.com' },
    update: {},
    create: {
      hospitalName: 'PRAVALLIKA GENERAL HOSPITAL',
      hospitalId: 'HOSP-PVL-066',
      officialEmail: 'pravallikaramu66@gmail.com',
      contactPerson: 'Pravallika',
      phoneNumber: '9123456066',
      location: 'Telangana, IN',
      password: hashedP,
      verificationStatus: 'active'
    }
  });

  await prisma.hospital.upsert({
    where: { officialEmail: 'pittakalpana88@gmail.com' },
    update: {},
    create: {
      hospitalName: 'KALPANA MEDICAL CENTER',
      hospitalId: 'HOSP-KLP-088',
      officialEmail: 'pittakalpana88@gmail.com',
      contactPerson: 'Kalpana',
      phoneNumber: '9123456088',
      location: 'Andhra Pradesh, IN',
      password: hashedK,
      verificationStatus: 'active'
    }
  });

  // 2. Another hospital (to interact with)
  const otherHosp = await prisma.hospital.upsert({
    where: { officialEmail: 'apollo_systems@med.org' },
    update: {},
    create: {
      hospitalName: 'APOLLO MEDICAL CENTER',
      hospitalId: 'HOSP-APL-001',
      officialEmail: 'apollo_systems@med.org',
      contactPerson: 'Dr. John Smith',
      phoneNumber: '9122334455',
      location: 'Hyderabad, TS',
      password: 'demo_password123',
      verificationStatus: 'active'
    }
  });

  // 2. Organs listed by ME
  const myKidney = await prisma.organ.create({
    data: {
      organType: 'Kidney',
      bloodGroup: 'B+',
      hlaType: 'HLA-A2,B7,DR4',
      donorAge: 32,
      donorGender: 'Male',
      donorName: 'Rahul Verma',
      donorGovtId: '1234-5678-9012',
      donorContact: '9876543210',
      extractionTime: new Date(),
      maxStorageMinutes: 2160, // 36h
      expiryTime: new Date(Date.now() + 36 * 60 * 60 * 1000),
      status: 'available',
      sourceHospitalId: MY_HOSP_ID,
      donorMedicalDetails: 'Aadhar/PAN: 1234-5678-9012, Contact: 9876543210'
    }
  });

  // 3. Organ listed by OTHER (to request)
  const otherHeart = await prisma.organ.create({
    data: {
      organType: 'Heart',
      bloodGroup: 'A-',
      hlaType: 'HLA-A1,B8,DR3',
      donorAge: 25,
      donorGender: 'Female',
      extractionTime: new Date(),
      maxStorageMinutes: 360, // 6h
      expiryTime: new Date(Date.now() + 6 * 60 * 60 * 1000),
      status: 'available',
      sourceHospitalId: otherHosp.id
    }
  });

  // 4. INCOMING REQUEST (Other -> Me)
  const incomingReq = await prisma.organRequest.create({
    data: {
      organId: myKidney.id,
      sourceHospitalId: MY_HOSP_ID,
      requestingHospitalId: otherHosp.id,
      urgencyLevel: 'high',
      patientAge: 45,
      patientBloodGroup: 'B+',
      patientHlaType: 'HLA-A2,B7,DR4',
      compatibilityScore: 92,
      status: 'pending'
    }
  });

  // 5. OUTGOING REQUEST (Me -> Other) (Approved + Transport)
  const outgoingReq = await prisma.organRequest.create({
    data: {
      organId: otherHeart.id,
      sourceHospitalId: otherHosp.id,
      requestingHospitalId: MY_HOSP_ID,
      urgencyLevel: 'critical',
      patientAge: 38,
      patientBloodGroup: 'A-',
      patientHlaType: 'HLA-A1,B8,DR3',
      compatibilityScore: 97,
      status: 'approved'
    }
  });

  // 6. TRANSPORT RECORD (for the outgoing request)
  await prisma.transportRecord.create({
    data: {
      requestId: outgoingReq.id,
      organId: otherHeart.id,
      sourceHospitalId: otherHosp.id,
      destinationHospitalId: MY_HOSP_ID,
      status: 'in_transit',
      vehicleType: 'Medical Helicopter',
      pilotName: 'Capt. Aryan Singh',
      totalDistanceKm: 420,
      remainingDistanceKm: 185,
      departureTime: new Date(Date.now() - 30 * 60 * 1000), // 30 mins ago
      estimatedArrivalTime: new Date(Date.now() + 90 * 60 * 1000),
      checkpoints: [
        { label: 'Dispatch from Apollo Center', done: true, time: new Date(Date.now() - 30 * 60 * 1000).toISOString() },
        { label: 'Airborne Medical Corridor', done: true, time: new Date(Date.now() - 10 * 60 * 1000).toISOString() },
        { label: 'Approaching Destination City', done: false, time: null },
        { label: 'Platform Clearance', done: false, time: null }
      ]
    }
  });

  // 7. COMPLETED RECORD + CERTIFICATE
  const pastOrgan = await prisma.organ.create({
    data: {
      organType: 'Liver',
      bloodGroup: 'O+',
      hlaType: 'HLA-A1,B8,DR3',
      extractionTime: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      maxStorageMinutes: 720,
      expiryTime: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
      status: 'completed',
      sourceHospitalId: MY_HOSP_ID,
      donorName: 'Aman Deep',
    }
  });

  const pastReq = await prisma.organRequest.create({
    data: {
      organId: pastOrgan.id,
      sourceHospitalId: MY_HOSP_ID,
      requestingHospitalId: otherHosp.id,
      urgencyLevel: 'medium',
      patientBloodGroup: 'O+',
      patientHlaType: 'N/A',
      status: 'completed'
    }
  });

  await prisma.donorCertificate.create({
    data: {
      requestId: pastReq.id,
      organId: pastOrgan.id,
      sourceHospitalId: MY_HOSP_ID,
      issuedToHospitalId: otherHosp.id,
      organType: 'Liver',
      certificateNumber: 'CERT-' + Math.random().toString(36).substring(7).toUpperCase(),
      issuedAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
    }
  });

  // 8. NOTIFICATIONS
  await prisma.notification.createMany({
    data: [
      { hospitalId: MY_HOSP_ID, title: 'New Request Received', message: 'APOLLO MEDICAL CENTER requested a Kidney from your registry.', type: 'info', isRead: false },
      { hospitalId: MY_HOSP_ID, title: 'Transport Started', message: 'Heart transport from Apollo Center is now airborne.', type: 'success', isRead: false },
      { hospitalId: MY_HOSP_ID, title: 'Network Update', message: 'System maintenance scheduled for tonight.', type: 'warning', isRead: true }
    ]
  });

  // 9. ACTIVE ALERT
  await prisma.alert.create({
    data: {
      createdByHospitalId: otherHosp.id,
      requiredOrgan: 'Lungs',
      urgencyLevel: 'critical',
      bloodGroup: 'B-',
      hlaType: 'HLA-A3,B44,DR7',
      status: 'active',
      expiresAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    }
  });

  console.log('Seeding COMPLETE! Every page in the dashboard should now have data.');
  await prisma.$disconnect();
}

seedEverything().catch(e => {
  console.error(e);
  process.exit(1);
});

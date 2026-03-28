import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const hospital = await prisma.hospital.findFirst();
  if (!hospital) return;

  // Create a Kidney Organ
  const kidney = await prisma.organ.create({
    data: {
      organType: 'Kidney',
      bloodGroup: 'B+',
      hlaType: 'HLA-DR4',
      donorAge: 29,
      donorGender: 'Female',
      donorMedicalDetails: 'Aadhar/PAN: 9876-XXXX-1234, Contact: 9988776655',
      extractionTime: new Date(),
      maxStorageMinutes: 1440,
      expiryTime: new Date(Date.now() + 1440 * 60000),
      status: 'available',
      sourceHospitalId: hospital.id
    }
  });

  const request = await prisma.organRequest.create({
    data: {
        organId: kidney.id,
        sourceHospitalId: hospital.id,
        requestingHospitalId: hospital.id,
        urgencyLevel: 'medium',
        patientBloodGroup: 'B+',
        patientHlaType: 'HLA-DR4',
        status: 'completed'
    }
  });

  const cert = await prisma.donorCertificate.create({
    data: {
      requestId: request.id,
      organId: kidney.id,
      sourceHospitalId: hospital.id,
      issuedToHospitalId: hospital.id,
      organType: 'Kidney',
      certificateNumber: `CERT-2026-KD-002`,
      issuedAt: new Date()
    }
  });

  console.log(`Sample Kidney Certificate Created: ${cert.certificateNumber}`);
}

main().catch(e => console.error(e)).finally(() => prisma.$disconnect());

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const hospital = await prisma.hospital.findFirst();
  const organ = await prisma.organ.findFirst();
  
  if (!hospital || !organ) {
    console.log("Need at least one hospital and one organ to create a certificate.");
    return;
  }

  // Create a dummy request to satisfy foreign key
  const request = await prisma.organRequest.create({
    data: {
        organId: organ.id,
        sourceHospitalId: hospital.id,
        requestingHospitalId: hospital.id, // Self for sample
        urgencyLevel: 'high',
        patientBloodGroup: 'O+',
        patientHlaType: 'HLA-A2',
        status: 'completed'
    }
  });

  const cert = await prisma.donorCertificate.create({
    data: {
      requestId: request.id,
      organId: organ.id,
      sourceHospitalId: hospital.id,
      issuedToHospitalId: hospital.id,
      organType: organ.organType,
      certificateNumber: `CERT-2026-HT-001`,
      issuedAt: new Date()
    }
  });

  console.log(`Sample Certificate Created: ${cert.certificateNumber}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

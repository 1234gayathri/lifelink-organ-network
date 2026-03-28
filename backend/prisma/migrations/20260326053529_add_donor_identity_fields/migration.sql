-- CreateTable
CREATE TABLE "Hospital" (
    "id" TEXT NOT NULL,
    "hospitalName" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "officialEmail" TEXT NOT NULL,
    "contactPerson" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "verificationStatus" TEXT NOT NULL DEFAULT 'pending',
    "accountStatus" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "resetPasswordToken" TEXT,
    "resetPasswordExpire" TIMESTAMP(3),

    CONSTRAINT "Hospital_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Admin" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Admin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Organ" (
    "id" TEXT NOT NULL,
    "organType" TEXT NOT NULL,
    "bloodGroup" TEXT NOT NULL,
    "hlaType" TEXT NOT NULL,
    "donorAge" INTEGER,
    "donorGender" TEXT,
    "donorMedicalDetails" TEXT,
    "donorName" TEXT,
    "donorGovtId" TEXT,
    "donorContact" TEXT,
    "familyName" TEXT,
    "familyContact" TEXT,
    "extractionTime" TIMESTAMP(3) NOT NULL,
    "maxStorageMinutes" INTEGER NOT NULL,
    "expiryTime" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'available',
    "notes" TEXT,
    "sourceHospitalId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organ_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrganRequest" (
    "id" TEXT NOT NULL,
    "organId" TEXT NOT NULL,
    "sourceHospitalId" TEXT NOT NULL,
    "requestingHospitalId" TEXT NOT NULL,
    "urgencyLevel" TEXT NOT NULL,
    "patientBloodGroup" TEXT NOT NULL,
    "patientHlaType" TEXT NOT NULL,
    "patientAge" INTEGER,
    "compatibilitySummary" TEXT,
    "compatibilityScore" INTEGER,
    "doctorNotes" TEXT,
    "caseSummary" TEXT,
    "status" TEXT NOT NULL DEFAULT 'sent',
    "rejectionReason" TEXT,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "respondedAt" TIMESTAMP(3),
    "approvedAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OrganRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Alert" (
    "id" TEXT NOT NULL,
    "createdByHospitalId" TEXT NOT NULL,
    "requiredOrgan" TEXT NOT NULL,
    "urgencyLevel" TEXT NOT NULL,
    "gender" TEXT,
    "age" INTEGER,
    "hlaType" TEXT NOT NULL,
    "bloodGroup" TEXT NOT NULL,
    "medicalNotes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Alert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "hospitalId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "relatedEntityType" TEXT,
    "relatedEntityId" TEXT,
    "priority" TEXT NOT NULL DEFAULT 'normal',
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransportRecord" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "organId" TEXT NOT NULL,
    "sourceHospitalId" TEXT NOT NULL,
    "destinationHospitalId" TEXT NOT NULL,
    "departureTime" TIMESTAMP(3),
    "currentLatitude" DOUBLE PRECISION,
    "currentLongitude" DOUBLE PRECISION,
    "destinationLatitude" DOUBLE PRECISION,
    "destinationLongitude" DOUBLE PRECISION,
    "totalDistanceKm" DOUBLE PRECISION,
    "remainingDistanceKm" DOUBLE PRECISION,
    "estimatedArrivalTime" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'pending',
    "organConditionStatus" TEXT,
    "transporterName" TEXT,
    "transporterContact" TEXT,
    "vehicleType" TEXT,
    "pilotName" TEXT,
    "emergencyContact" TEXT,
    "checkpoints" JSONB,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransportRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DonorCertificate" (
    "id" TEXT NOT NULL,
    "requestId" TEXT NOT NULL,
    "organId" TEXT NOT NULL,
    "sourceHospitalId" TEXT NOT NULL,
    "issuedToHospitalId" TEXT NOT NULL,
    "organType" TEXT NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "certificateNumber" TEXT NOT NULL,
    "pdfUrl" TEXT,

    CONSTRAINT "DonorCertificate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL,
    "hospital1Id" TEXT NOT NULL,
    "hospital2Id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorUserId" TEXT NOT NULL,
    "actorRole" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "metadata" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_hospitalId_key" ON "Hospital"("hospitalId");

-- CreateIndex
CREATE UNIQUE INDEX "Hospital_officialEmail_key" ON "Hospital"("officialEmail");

-- CreateIndex
CREATE UNIQUE INDEX "Admin_email_key" ON "Admin"("email");

-- CreateIndex
CREATE UNIQUE INDEX "TransportRecord_requestId_key" ON "TransportRecord"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "DonorCertificate_requestId_key" ON "DonorCertificate"("requestId");

-- CreateIndex
CREATE UNIQUE INDEX "DonorCertificate_certificateNumber_key" ON "DonorCertificate"("certificateNumber");

-- CreateIndex
CREATE INDEX "Otp_email_purpose_idx" ON "Otp"("email", "purpose");

-- CreateIndex
CREATE UNIQUE INDEX "Conversation_hospital1Id_hospital2Id_key" ON "Conversation"("hospital1Id", "hospital2Id");

-- AddForeignKey
ALTER TABLE "Organ" ADD CONSTRAINT "Organ_sourceHospitalId_fkey" FOREIGN KEY ("sourceHospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganRequest" ADD CONSTRAINT "OrganRequest_organId_fkey" FOREIGN KEY ("organId") REFERENCES "Organ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganRequest" ADD CONSTRAINT "OrganRequest_requestingHospitalId_fkey" FOREIGN KEY ("requestingHospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrganRequest" ADD CONSTRAINT "OrganRequest_sourceHospitalId_fkey" FOREIGN KEY ("sourceHospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Alert" ADD CONSTRAINT "Alert_createdByHospitalId_fkey" FOREIGN KEY ("createdByHospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRecord" ADD CONSTRAINT "TransportRecord_destinationHospitalId_fkey" FOREIGN KEY ("destinationHospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRecord" ADD CONSTRAINT "TransportRecord_organId_fkey" FOREIGN KEY ("organId") REFERENCES "Organ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRecord" ADD CONSTRAINT "TransportRecord_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "OrganRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransportRecord" ADD CONSTRAINT "TransportRecord_sourceHospitalId_fkey" FOREIGN KEY ("sourceHospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorCertificate" ADD CONSTRAINT "DonorCertificate_issuedToHospitalId_fkey" FOREIGN KEY ("issuedToHospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorCertificate" ADD CONSTRAINT "DonorCertificate_organId_fkey" FOREIGN KEY ("organId") REFERENCES "Organ"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorCertificate" ADD CONSTRAINT "DonorCertificate_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "OrganRequest"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DonorCertificate" ADD CONSTRAINT "DonorCertificate_sourceHospitalId_fkey" FOREIGN KEY ("sourceHospitalId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_hospital1Id_fkey" FOREIGN KEY ("hospital1Id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Conversation" ADD CONSTRAINT "Conversation_hospital2Id_fkey" FOREIGN KEY ("hospital2Id") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "Hospital"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

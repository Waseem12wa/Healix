#!/usr/bin/env node

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../models/User.js';
import MedicineInventory from '../models/MedicineInventory.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || '';
const SHARED_PASSWORD = 'Password123+-';
const START_INDEX = 5;
const ACCOUNT_COUNT = 20;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is required in server/.env');
  process.exit(1);
}

const genders = ['Male', 'Female'];
const cities = ['Karachi', 'Lahore', 'Islamabad', 'Peshawar', 'Multan'];
const specializations = [
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Neurologist',
  'Orthopedic Surgeon',
  'Gynecologist',
  'Psychiatrist',
  'General Physician',
  'Urologist',
  'Endocrinologist',
];

const medicineTemplates = [
  { name: 'Paracetamol 500mg Tablets', category: 'Analgesic', genericName: 'Paracetamol', use: 'Fever and mild pain', dosage: 'Pack Size: 20 tablets', price: 180 },
  { name: 'Ibuprofen 400mg Tablets', category: 'NSAID', genericName: 'Ibuprofen', use: 'Pain and inflammation', dosage: 'Pack Size: 20 tablets', price: 240 },
  { name: 'Aspirin 75mg Tablets', category: 'Cardiac', genericName: 'Acetylsalicylic Acid', use: 'Blood thinning support', dosage: 'Pack Size: 30 tablets', price: 190 },
  { name: 'Amoxicillin 625mg', category: 'Antibiotic', genericName: 'Amoxicillin + Clavulanate', use: 'Bacterial infections', dosage: 'Pack Size: 10 tablets', price: 420 },
  { name: 'Azithromycin 500mg', category: 'Antibiotic', genericName: 'Azithromycin', use: 'Respiratory infections', dosage: 'Pack Size: 3 tablets', price: 350 },
  { name: 'Metformin 850mg', category: 'Diabetes', genericName: 'Metformin', use: 'Type 2 diabetes control', dosage: 'Pack Size: 30 tablets', price: 280 },
  { name: 'Insulin Glargine Pen', category: 'Diabetes', genericName: 'Insulin Glargine', use: 'Long-acting insulin', dosage: 'Pack Size: 1 pen', price: 2600 },
  { name: 'Amlodipine 5mg', category: 'Hypertension', genericName: 'Amlodipine', use: 'Blood pressure control', dosage: 'Pack Size: 30 tablets', price: 210 },
  { name: 'Losartan 50mg', category: 'Hypertension', genericName: 'Losartan', use: 'Blood pressure control', dosage: 'Pack Size: 30 tablets', price: 260 },
  { name: 'Atorvastatin 20mg', category: 'Cholesterol', genericName: 'Atorvastatin', use: 'High cholesterol', dosage: 'Pack Size: 30 tablets', price: 300 },
  { name: 'Omeprazole 20mg', category: 'Gastro', genericName: 'Omeprazole', use: 'Acidity and GERD', dosage: 'Pack Size: 14 capsules', price: 220 },
  { name: 'Ranitidine 150mg', category: 'Gastro', genericName: 'Ranitidine', use: 'Acid reflux relief', dosage: 'Pack Size: 20 tablets', price: 170 },
  { name: 'Cetirizine 10mg', category: 'Allergy', genericName: 'Cetirizine', use: 'Allergy relief', dosage: 'Pack Size: 20 tablets', price: 150 },
  { name: 'Loratadine 10mg', category: 'Allergy', genericName: 'Loratadine', use: 'Seasonal allergies', dosage: 'Pack Size: 10 tablets', price: 145 },
  { name: 'Vitamin C 1000mg', category: 'Supplements', genericName: 'Ascorbic Acid', use: 'Immune support', dosage: 'Pack Size: 20 tablets', price: 230 },
  { name: 'Vitamin D3 2000IU', category: 'Supplements', genericName: 'Cholecalciferol', use: 'Bone health', dosage: 'Pack Size: 30 capsules', price: 260 },
  { name: 'Calcium + D Tablets', category: 'Supplements', genericName: 'Calcium Carbonate + Vitamin D', use: 'Bone strength', dosage: 'Pack Size: 30 tablets', price: 300 },
  { name: 'ORS Sachets', category: 'Hydration', genericName: 'Oral Rehydration Salts', use: 'Dehydration recovery', dosage: 'Pack Size: 10 sachets', price: 200 },
  { name: 'KN95 Mask Pack', category: 'Protection', genericName: 'KN95', use: 'Respiratory protection', dosage: 'Pack Size: 5 masks', price: 400 },
  { name: 'Digital Thermometer', category: 'Devices', genericName: 'Digital Thermometer', use: 'Body temperature check', dosage: 'Pack Size: 1 piece', price: 950 },
];

const toUserName = (prefix, index) => `${prefix}${index}`;

const makeDoctorProfile = (index) => {
  const city = cities[index % cities.length];
  const specialization = specializations[index % specializations.length];
  const fullName = `Dr. ${String.fromCharCode(65 + (index % 26))}Doctor ${index}`;
  const gender = genders[index % genders.length];

  return {
    fullName,
    phoneNumber: `+92-300-${String(1000000 + index).slice(-7)}`,
    gender,
    specialization,
    subSpecialization: `${specialization} Care`,
    education: ['MBBS', `FCPS (${specialization})`],
    pmdcNumber: `PMDC-${60000 + index}`,
    yearsOfExperience: 5 + (index % 15),
    professionalBio: `${fullName} is an experienced ${specialization.toLowerCase()} with patient-focused care.`,
    languagesSpoken: ['English', 'Urdu'],
    clinicName: `${specialization} Clinic ${index}`,
    clinicAddress: `Block ${index}, Main Boulevard`,
    city,
    mapLocation: `${24 + (index % 10) / 10}, ${67 + (index % 10) / 10}`,
    workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    startTime: '09:00',
    endTime: '17:00',
    slotDuration: 30,
    inPersonFee: 2000 + index * 20,
    onlineFee: 1500 + index * 20,
    profileCompleted: true,
  };
};

const upsertUser = async ({ email, role, userName, doctorProfile, patientProfile, reminderEmail }) => {
  const normalizedEmail = String(email).trim().toLowerCase();
  let user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    user = new User({
      email: normalizedEmail,
      password: SHARED_PASSWORD,
      role,
      userName,
      doctorProfile,
      patientProfile,
      reminderEmail,
    });
  } else {
    user.email = normalizedEmail;
    user.password = SHARED_PASSWORD;
    user.role = role;
    user.userName = userName;
    if (doctorProfile) user.doctorProfile = doctorProfile;
    if (patientProfile) user.patientProfile = patientProfile;
    if (reminderEmail !== undefined) user.reminderEmail = reminderEmail;
  }

  await user.save();
  return user;
};

const seedMedicines = async () => {
  await MedicineInventory.deleteMany({});

  const now = Date.now();
  const medicines = medicineTemplates.map((item, idx) => ({
    medicineName: item.name,
    genericName: item.genericName,
    category: item.category,
    therapeuticUse: item.use,
    commonDosage: item.dosage,
    sellingPrice: item.price,
    costPrice: Math.max(1, Math.round(item.price * 0.65)),
    quantity: 150 + idx * 20,
    currency: 'PKR',
    batchNumber: `HX-B-${5000 + idx}`,
    expiryDate: new Date(now + (365 + idx * 10) * 24 * 60 * 60 * 1000),
    isActive: true,
    imageUrl: `https://placehold.co/320x220/png?text=${encodeURIComponent(item.name)}`,
    supplier: {
      name: 'Healix Demo Supplier',
      email: 'supplier@helix.com',
      phone: '+92-300-5551234',
    },
  }));

  await MedicineInventory.insertMany(medicines);
  return medicines.length;
};

const run = async () => {
  await mongoose.connect(MONGODB_URI);
  console.log('Connected to MongoDB');

  const createdDoctors = [];
  const createdPatients = [];

  for (let i = 0; i < ACCOUNT_COUNT; i += 1) {
    const n = START_INDEX + i;

    const doctor = await upsertUser({
      email: `doctor${n}@helix.com`,
      role: 'doctor',
      userName: toUserName('doctor', n),
      doctorProfile: makeDoctorProfile(n),
    });
    createdDoctors.push(doctor);

    await upsertUser({
      email: `admin${n}@helix.com`,
      role: 'admin',
      userName: toUserName('admin', n),
    });

    await upsertUser({
      email: `provider${n}@helix.com`,
      role: 'provider',
      userName: toUserName('provider', n),
    });

    const patient = await upsertUser({
      email: `patient${n}@helix.com`,
      role: 'patient',
      userName: toUserName('patient', n),
      reminderEmail: `patient${n}@helix.com`,
      patientProfile: {
        profileImage: `https://placehold.co/200x200/png?text=P${n}`,
        assignedDoctorId: null,
        age: 18 + (n % 40),
        gender: genders[n % genders.length],
        mobileNumber: `+92-301-${String(1000000 + n).slice(-7)}`,
        bio: `Patient profile for patient${n}.`,
      },
    });

    createdPatients.push(patient);
  }

  for (let i = 0; i < createdPatients.length; i += 1) {
    const patient = createdPatients[i];
    const assignedDoctor = createdDoctors[i % createdDoctors.length];

    patient.patientProfile = {
      ...(patient.patientProfile || {}),
      assignedDoctorId: assignedDoctor._id,
    };

    await patient.save();
  }

  const medicineCount = await seedMedicines();

  console.log('Seed summary:');
  console.log(`- Admins: ${ACCOUNT_COUNT} (admin${START_INDEX}@helix.com -> admin${START_INDEX + ACCOUNT_COUNT - 1}@helix.com)`);
  console.log(`- Patients: ${ACCOUNT_COUNT} (patient${START_INDEX}@helix.com -> patient${START_INDEX + ACCOUNT_COUNT - 1}@helix.com)`);
  console.log(`- Providers: ${ACCOUNT_COUNT} (provider${START_INDEX}@helix.com -> provider${START_INDEX + ACCOUNT_COUNT - 1}@helix.com)`);
  console.log(`- Doctors: ${ACCOUNT_COUNT} fully completed profiles`);
  console.log(`- Medicines: ${medicineCount}`);
  console.log(`- Shared password for all seeded accounts: ${SHARED_PASSWORD}`);

  await mongoose.disconnect();
  console.log('Disconnected');
};

run().catch(async (error) => {
  console.error('Seed failed:', error);
  try {
    await mongoose.disconnect();
  } catch (_) {
    // ignore
  }
  process.exit(1);
});

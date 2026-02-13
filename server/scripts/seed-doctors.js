import dotenv from 'dotenv';
import { connectDB, disconnectDB } from '../config/db.js';
import User from '../models/User.js';
import bcrypt from 'bcryptjs';

dotenv.config();

// 20 Complete Doctor Profiles with Pakistani Names and Details
const doctors = [
  {
    email: 'ahsan.siddiqui@healix.com',
    password: 'Doctor@123',
    userName: 'ahsan.siddiqui',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Ahsan Siddiqui',
      phoneNumber: '+92-300-1234567',
      gender: 'Male',
      specialization: 'Cardiologist',
      subSpecialization: 'Interventional Cardiology',
      education: ['MBBS', 'FCPS (Cardiology)', 'FRCP (London)'],
      pmdcNumber: 'PMDC-12345',
      yearsOfExperience: 15,
      professionalBio: 'Renowned cardiologist with 15 years of experience in treating heart diseases. Specialized in interventional cardiology and cardiac rehabilitation.',
      languagesSpoken: ['Urdu', 'English', 'Sindhi'],
      clinicName: 'Heart Care Center',
      clinicAddress: 'Block 5, Clifton, Near Seaview',
      city: 'Karachi',
      mapLocation: '24.8138, 67.0281',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30,
      inPersonFee: 3000,
      onlineFee: 2500,
      profileCompleted: true
    }
  },
  {
    email: 'hina.qureshi@healix.com',
    password: 'Doctor@123',
    userName: 'hina.qureshi',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Hina Qureshi',
      phoneNumber: '+92-300-2345678',
      gender: 'Female',
      specialization: 'Dermatologist',
      subSpecialization: 'Cosmetic Dermatology',
      education: ['MBBS', 'FCPS (Dermatology)', 'Diploma in Aesthetic Medicine'],
      pmdcNumber: 'PMDC-12346',
      yearsOfExperience: 12,
      professionalBio: 'Expert dermatologist specializing in skin diseases, cosmetic procedures, and hair treatments. Committed to providing personalized care.',
      languagesSpoken: ['Urdu', 'English', 'Punjabi'],
      clinicName: 'Skin & Beauty Clinic',
      clinicAddress: 'Model Town, Main Boulevard',
      city: 'Lahore',
      mapLocation: '31.5204, 74.3587',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
      startTime: '10:00',
      endTime: '18:00',
      slotDuration: 15,
      inPersonFee: 2500,
      onlineFee: 2000,
      profileCompleted: true
    }
  },
  {
    email: 'kamran.ali@healix.com',
    password: 'Doctor@123',
    userName: 'kamran.ali',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Kamran Ali',
      phoneNumber: '+92-300-3456789',
      gender: 'Male',
      specialization: 'Orthopedic Surgeon',
      subSpecialization: 'Joint Replacement',
      education: ['MBBS', 'FCPS (Orthopedics)', 'Fellowship in Joint Replacement'],
      pmdcNumber: 'PMDC-12347',
      yearsOfExperience: 18,
      professionalBio: 'Senior orthopedic surgeon with expertise in joint replacement, sports injuries, and trauma surgery. Over 1000 successful surgeries.',
      languagesSpoken: ['Urdu', 'English'],
      clinicName: 'Bone & Joint Hospital',
      clinicAddress: 'Sector F-7, Jinnah Avenue',
      city: 'Islamabad',
      mapLocation: '33.6844, 73.0479',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00',
      endTime: '16:00',
      slotDuration: 30,
      inPersonFee: 4000,
      onlineFee: 3000,
      profileCompleted: true
    }
  },
  {
    email: 'sara.ahmed@healix.com',
    password: 'Doctor@123',
    userName: 'sara.ahmed',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Sara Ahmed',
      phoneNumber: '+92-300-4567890',
      gender: 'Female',
      specialization: 'Pediatrician',
      subSpecialization: 'Neonatology',
      education: ['MBBS', 'FCPS (Pediatrics)', 'Diploma in Child Health'],
      pmdcNumber: 'PMDC-12348',
      yearsOfExperience: 10,
      professionalBio: 'Caring pediatrician specializing in newborn care and childhood diseases. Passionate about child health and development.',
      languagesSpoken: ['Urdu', 'English', 'Pushto'],
      clinicName: 'Kids Care Clinic',
      clinicAddress: 'University Road, Near Peshawar University',
      city: 'Peshawar',
      mapLocation: '34.0151, 71.5249',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '08:00',
      endTime: '14:00',
      slotDuration: 15,
      inPersonFee: 2000,
      onlineFee: 1500,
      profileCompleted: true
    }
  },
  {
    email: 'zubair.hassan@healix.com',
    password: 'Doctor@123',
    userName: 'zubair.hassan',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Zubair Hassan',
      phoneNumber: '+92-300-5678901',
      gender: 'Male',
      specialization: 'Neurologist',
      subSpecialization: 'Stroke Medicine',
      education: ['MBBS', 'FCPS (Neurology)', 'MRCP (UK)'],
      pmdcNumber: 'PMDC-12349',
      yearsOfExperience: 14,
      professionalBio: 'Expert neurologist specializing in stroke treatment, epilepsy, and movement disorders. Committed to improving neurological health.',
      languagesSpoken: ['Urdu', 'English', 'Sindhi'],
      clinicName: 'Neuro Care Center',
      clinicAddress: 'Gulshan-e-Iqbal, Block 13',
      city: 'Karachi',
      mapLocation: '24.9056, 67.0822',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '10:00',
      endTime: '17:00',
      slotDuration: 30,
      inPersonFee: 3500,
      onlineFee: 2800,
      profileCompleted: true
    }
  },
  {
    email: 'fatima.khan@healix.com',
    password: 'Doctor@123',
    userName: 'fatima.khan',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Fatima Khan',
      phoneNumber: '+92-300-6789012',
      gender: 'Female',
      specialization: 'Gynecologist',
      subSpecialization: 'Infertility Treatment',
      education: ['MBBS', 'FCPS (Gynecology)', 'Diploma in Reproductive Medicine'],
      pmdcNumber: 'PMDC-12350',
      yearsOfExperience: 13,
      professionalBio: 'Experienced gynecologist specializing in women\'s health, infertility treatment, and high-risk pregnancies. Providing compassionate care.',
      languagesSpoken: ['Urdu', 'English', 'Punjabi'],
      clinicName: 'Women\'s Health Clinic',
      clinicAddress: 'Defence Phase 5, DHA',
      city: 'Lahore',
      mapLocation: '31.4697, 74.2728',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '09:00',
      endTime: '16:00',
      slotDuration: 20,
      inPersonFee: 3000,
      onlineFee: 2500,
      profileCompleted: true
    }
  },
  {
    email: 'tariq.malik@healix.com',
    password: 'Doctor@123',
    userName: 'tariq.malik',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Tariq Malik',
      phoneNumber: '+92-300-7890123',
      gender: 'Male',
      specialization: 'Gastroenterologist',
      subSpecialization: 'Hepatology',
      education: ['MBBS', 'FCPS (Gastroenterology)', 'Fellowship in Hepatology'],
      pmdcNumber: 'PMDC-12351',
      yearsOfExperience: 16,
      professionalBio: 'Senior gastroenterologist with expertise in liver diseases, digestive disorders, and endoscopic procedures.',
      languagesSpoken: ['Urdu', 'English'],
      clinicName: 'Digestive Health Center',
      clinicAddress: 'Blue Area, Jinnah Avenue',
      city: 'Islamabad',
      mapLocation: '33.6844, 73.0479',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30,
      inPersonFee: 3500,
      onlineFee: 2800,
      profileCompleted: true
    }
  },
  {
    email: 'amina.sheikh@healix.com',
    password: 'Doctor@123',
    userName: 'amina.sheikh',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Amina Sheikh',
      phoneNumber: '+92-300-8901234',
      gender: 'Female',
      specialization: 'Psychiatrist',
      subSpecialization: 'Child & Adolescent Psychiatry',
      education: ['MBBS', 'FCPS (Psychiatry)', 'Diploma in Mental Health'],
      pmdcNumber: 'PMDC-12352',
      yearsOfExperience: 11,
      professionalBio: 'Compassionate psychiatrist specializing in child and adolescent mental health. Providing therapy and medication management.',
      languagesSpoken: ['Urdu', 'English', 'Pushto'],
      clinicName: 'Mind Care Clinic',
      clinicAddress: 'Cantt Area, Main Road',
      city: 'Quetta',
      mapLocation: '30.1798, 66.9750',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '10:00',
      endTime: '18:00',
      slotDuration: 30,
      inPersonFee: 3000,
      onlineFee: 2500,
      profileCompleted: true
    }
  },
  {
    email: 'bilal.raza@healix.com',
    password: 'Doctor@123',
    userName: 'bilal.raza',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Bilal Raza',
      phoneNumber: '+92-300-9012345',
      gender: 'Male',
      specialization: 'Urologist',
      subSpecialization: 'Laparoscopic Urology',
      education: ['MBBS', 'FCPS (Urology)', 'Fellowship in Laparoscopic Surgery'],
      pmdcNumber: 'PMDC-12353',
      yearsOfExperience: 12,
      professionalBio: 'Expert urologist specializing in minimally invasive procedures, kidney stones, and prostate diseases.',
      languagesSpoken: ['Urdu', 'English', 'Saraiki'],
      clinicName: 'Urology Care Center',
      clinicAddress: 'Bosan Road, Model Town',
      city: 'Multan',
      mapLocation: '30.1575, 71.5249',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00',
      endTime: '16:00',
      slotDuration: 30,
      inPersonFee: 3500,
      onlineFee: 2800,
      profileCompleted: true
    }
  },
  {
    email: 'nida.butt@healix.com',
    password: 'Doctor@123',
    userName: 'nida.butt',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Nida Butt',
      phoneNumber: '+92-300-0123456',
      gender: 'Female',
      specialization: 'Ophthalmologist',
      subSpecialization: 'Retina Specialist',
      education: ['MBBS', 'FCPS (Ophthalmology)', 'Fellowship in Retina'],
      pmdcNumber: 'PMDC-12354',
      yearsOfExperience: 9,
      professionalBio: 'Skilled ophthalmologist specializing in retinal diseases, diabetic retinopathy, and cataract surgery.',
      languagesSpoken: ['Urdu', 'English', 'Punjabi'],
      clinicName: 'Eye Care Hospital',
      clinicAddress: 'Gulberg, Main Boulevard',
      city: 'Faisalabad',
      mapLocation: '31.4504, 73.1350',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 20,
      inPersonFee: 2500,
      onlineFee: 2000,
      profileCompleted: true
    }
  },
  {
    email: 'usman.abbas@healix.com',
    password: 'Doctor@123',
    userName: 'usman.abbas',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Usman Abbas',
      phoneNumber: '+92-300-1234568',
      gender: 'Male',
      specialization: 'ENT Specialist',
      subSpecialization: 'Head & Neck Surgery',
      education: ['MBBS', 'FCPS (ENT)', 'Fellowship in Head & Neck Surgery'],
      pmdcNumber: 'PMDC-12355',
      yearsOfExperience: 14,
      professionalBio: 'Experienced ENT specialist with expertise in sinus surgery, hearing disorders, and head & neck procedures.',
      languagesSpoken: ['Urdu', 'English'],
      clinicName: 'ENT Care Clinic',
      clinicAddress: 'Saddar, Main Bazaar',
      city: 'Rawalpindi',
      mapLocation: '33.5651, 73.0169',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '10:00',
      endTime: '18:00',
      slotDuration: 15,
      inPersonFee: 2500,
      onlineFee: 2000,
      profileCompleted: true
    }
  },
  {
    email: 'sana.mirza@healix.com',
    password: 'Doctor@123',
    userName: 'sana.mirza',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Sana Mirza',
      phoneNumber: '+92-300-2345679',
      gender: 'Female',
      specialization: 'Endocrinologist',
      subSpecialization: 'Diabetes Management',
      education: ['MBBS', 'FCPS (Endocrinology)', 'Diploma in Diabetes Care'],
      pmdcNumber: 'PMDC-12356',
      yearsOfExperience: 10,
      professionalBio: 'Specialized endocrinologist focusing on diabetes management, thyroid disorders, and hormonal imbalances.',
      languagesSpoken: ['Urdu', 'English', 'Sindhi'],
      clinicName: 'Diabetes Care Center',
      clinicAddress: 'Bahadurabad, Main Road',
      city: 'Karachi',
      mapLocation: '24.8808, 67.0624',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00',
      endTime: '16:00',
      slotDuration: 30,
      inPersonFee: 3000,
      onlineFee: 2500,
      profileCompleted: true
    }
  },
  {
    email: 'faisal.awan@healix.com',
    password: 'Doctor@123',
    userName: 'faisal.awan',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Faisal Awan',
      phoneNumber: '+92-300-3456780',
      gender: 'Male',
      specialization: 'Pulmonologist',
      subSpecialization: 'Critical Care',
      education: ['MBBS', 'FCPS (Pulmonology)', 'Fellowship in Critical Care'],
      pmdcNumber: 'PMDC-12357',
      yearsOfExperience: 13,
      professionalBio: 'Expert pulmonologist specializing in respiratory diseases, asthma, COPD, and critical care management.',
      languagesSpoken: ['Urdu', 'English', 'Punjabi'],
      clinicName: 'Lung Care Hospital',
      clinicAddress: 'Johar Town, Block H',
      city: 'Lahore',
      mapLocation: '31.4697, 74.2728',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30,
      inPersonFee: 3500,
      onlineFee: 2800,
      profileCompleted: true
    }
  },
  {
    email: 'rabia.ali@healix.com',
    password: 'Doctor@123',
    userName: 'rabia.ali',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Rabia Ali',
      phoneNumber: '+92-300-4567891',
      gender: 'Female',
      specialization: 'Rheumatologist',
      subSpecialization: 'Autoimmune Diseases',
      education: ['MBBS', 'FCPS (Rheumatology)', 'MRCP (UK)'],
      pmdcNumber: 'PMDC-12358',
      yearsOfExperience: 8,
      professionalBio: 'Specialized rheumatologist treating arthritis, lupus, and other autoimmune conditions with modern treatment approaches.',
      languagesSpoken: ['Urdu', 'English'],
      clinicName: 'Arthritis Care Clinic',
      clinicAddress: 'Sector G-10, Markaz',
      city: 'Islamabad',
      mapLocation: '33.6844, 73.0479',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '10:00',
      endTime: '17:00',
      slotDuration: 30,
      inPersonFee: 3000,
      onlineFee: 2500,
      profileCompleted: true
    }
  },
  {
    email: 'hamza.baig@healix.com',
    password: 'Doctor@123',
    userName: 'hamza.baig',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Hamza Baig',
      phoneNumber: '+92-300-5678902',
      gender: 'Male',
      specialization: 'Oncologist',
      subSpecialization: 'Medical Oncology',
      education: ['MBBS', 'FCPS (Oncology)', 'Fellowship in Medical Oncology'],
      pmdcNumber: 'PMDC-12359',
      yearsOfExperience: 15,
      professionalBio: 'Senior oncologist with extensive experience in cancer treatment, chemotherapy, and personalized cancer care.',
      languagesSpoken: ['Urdu', 'English', 'Pushto'],
      clinicName: 'Cancer Care Center',
      clinicAddress: 'University Road, Near Khyber Medical College',
      city: 'Peshawar',
      mapLocation: '34.0151, 71.5249',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00',
      endTime: '16:00',
      slotDuration: 30,
      inPersonFee: 5000,
      onlineFee: 4000,
      profileCompleted: true
    }
  },
  {
    email: 'zainab.rizvi@healix.com',
    password: 'Doctor@123',
    userName: 'zainab.rizvi',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Zainab Rizvi',
      phoneNumber: '+92-300-6789013',
      gender: 'Female',
      specialization: 'Nephrologist',
      subSpecialization: 'Dialysis & Transplant',
      education: ['MBBS', 'FCPS (Nephrology)', 'Fellowship in Renal Transplant'],
      pmdcNumber: 'PMDC-12360',
      yearsOfExperience: 12,
      professionalBio: 'Expert nephrologist specializing in kidney diseases, dialysis management, and renal transplantation.',
      languagesSpoken: ['Urdu', 'English', 'Sindhi'],
      clinicName: 'Kidney Care Hospital',
      clinicAddress: 'Gulistan-e-Johar, Block 15',
      city: 'Karachi',
      mapLocation: '24.9207, 67.0883',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00',
      endTime: '17:00',
      slotDuration: 30,
      inPersonFee: 4000,
      onlineFee: 3200,
      profileCompleted: true
    }
  },
  {
    email: 'adnan.chaudhry@healix.com',
    password: 'Doctor@123',
    userName: 'adnan.chaudhry',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Adnan Chaudhry',
      phoneNumber: '+92-300-7890124',
      gender: 'Male',
      specialization: 'General Surgeon',
      subSpecialization: 'Laparoscopic Surgery',
      education: ['MBBS', 'FCPS (Surgery)', 'Fellowship in Laparoscopic Surgery'],
      pmdcNumber: 'PMDC-12361',
      yearsOfExperience: 17,
      professionalBio: 'Senior general surgeon with expertise in minimally invasive procedures, appendectomy, and hernia repair.',
      languagesSpoken: ['Urdu', 'English', 'Punjabi'],
      clinicName: 'Surgical Care Center',
      clinicAddress: 'Model Town Link Road',
      city: 'Lahore',
      mapLocation: '31.4697, 74.2728',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '09:00',
      endTime: '16:00',
      slotDuration: 30,
      inPersonFee: 4000,
      onlineFee: 3000,
      profileCompleted: true
    }
  },
  {
    email: 'maryam.hussain@healix.com',
    password: 'Doctor@123',
    userName: 'maryam.hussain',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Maryam Hussain',
      phoneNumber: '+92-300-8901235',
      gender: 'Female',
      specialization: 'Radiologist',
      subSpecialization: 'MRI & CT Scan',
      education: ['MBBS', 'FCPS (Radiology)', 'Fellowship in Imaging'],
      pmdcNumber: 'PMDC-12362',
      yearsOfExperience: 11,
      professionalBio: 'Expert radiologist specializing in diagnostic imaging, MRI, CT scans, and ultrasound procedures.',
      languagesSpoken: ['Urdu', 'English'],
      clinicName: 'Advanced Imaging Center',
      clinicAddress: 'Sector F-8, Markaz',
      city: 'Islamabad',
      mapLocation: '33.6844, 73.0479',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '08:00',
      endTime: '16:00',
      slotDuration: 15,
      inPersonFee: 3000,
      onlineFee: 2500,
      profileCompleted: true
    }
  },
  {
    email: 'saad.qureshi@healix.com',
    password: 'Doctor@123',
    userName: 'saad.qureshi',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Saad Qureshi',
      phoneNumber: '+92-300-9012346',
      gender: 'Male',
      specialization: 'Anesthesiologist',
      subSpecialization: 'Pain Management',
      education: ['MBBS', 'FCPS (Anesthesiology)', 'Fellowship in Pain Management'],
      pmdcNumber: 'PMDC-12363',
      yearsOfExperience: 10,
      professionalBio: 'Experienced anesthesiologist specializing in pain management, regional anesthesia, and perioperative care.',
      languagesSpoken: ['Urdu', 'English', 'Saraiki'],
      clinicName: 'Pain Management Clinic',
      clinicAddress: 'Cantt Area, Circular Road',
      city: 'Multan',
      mapLocation: '30.1575, 71.5249',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      startTime: '10:00',
      endTime: '17:00',
      slotDuration: 30,
      inPersonFee: 3000,
      onlineFee: 2500,
      profileCompleted: true
    }
  },
  {
    email: 'ayesha.ahmed@healix.com',
    password: 'Doctor@123',
    userName: 'ayesha.ahmed',
    role: 'doctor',
    doctorProfile: {
      fullName: 'Dr. Ayesha Ahmed',
      phoneNumber: '+92-300-0123457',
      gender: 'Female',
      specialization: 'Physiotherapist',
      subSpecialization: 'Sports Medicine',
      education: ['DPT', 'MSPT (Sports Medicine)', 'Certified Manual Therapist'],
      pmdcNumber: 'PMDC-12364',
      yearsOfExperience: 9,
      professionalBio: 'Expert physiotherapist specializing in sports injuries, rehabilitation, and pain management through physical therapy.',
      languagesSpoken: ['Urdu', 'English', 'Punjabi'],
      clinicName: 'Physio Care Center',
      clinicAddress: 'Satellite Town, Main Road',
      city: 'Rawalpindi',
      mapLocation: '33.5651, 73.0169',
      workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      startTime: '09:00',
      endTime: '18:00',
      slotDuration: 30,
      inPersonFee: 2000,
      onlineFee: 1500,
      profileCompleted: true
    }
  }
];

const seedDoctors = async () => {
  try {
    console.log('🌱 Starting doctor seeding process...\n');
    
    // Connect to database
    await connectDB();
    console.log('✅ Connected to MongoDB\n');

    let created = 0;
    let skipped = 0;
    let errors = 0;

    for (const doctorData of doctors) {
      try {
        // Check if doctor already exists
        const existingDoctor = await User.findOne({ 
          email: doctorData.email.toLowerCase().trim() 
        });

        if (existingDoctor) {
          console.log(`⏭️  Skipping ${doctorData.doctorProfile.fullName} - already exists`);
          skipped++;
          continue;
        }

        // Hash password before creating user
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(doctorData.password, salt);

        // Create doctor user
        const doctor = new User({
          email: doctorData.email.toLowerCase().trim(),
          password: hashedPassword,
          userName: doctorData.userName,
          role: 'doctor',
          doctorProfile: doctorData.doctorProfile
        });

        // Save to database
        await doctor.save();

        console.log(`✅ Created: ${doctorData.doctorProfile.fullName} - ${doctorData.doctorProfile.specialization} - ${doctorData.doctorProfile.city}`);
        created++;
      } catch (error) {
        console.error(`❌ Error creating ${doctorData.doctorProfile.fullName}:`, error.message);
        errors++;
      }
    }

    console.log('\n📊 Seeding Summary:');
    console.log(`   ✅ Created: ${created} doctors`);
    console.log(`   ⏭️  Skipped: ${skipped} doctors (already exist)`);
    console.log(`   ❌ Errors: ${errors} doctors`);
    console.log(`\n🎉 Seeding completed!`);

    // Verify doctors
    const totalDoctors = await User.countDocuments({ 
      role: 'doctor',
      'doctorProfile.profileCompleted': true 
    });
    console.log(`\n📈 Total doctors with completed profiles in database: ${totalDoctors}`);

  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await disconnectDB();
    process.exit(0);
  }
};

// Run seeder
seedDoctors();


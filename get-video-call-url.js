// Quick script to get video call URL for an appointment
require('dotenv').config({ path: __dirname + '/.env' });
const mongoose = require('mongoose');
const Appointment = require('./models/appointment');
const Doctor = require('./models/doctor');
const Patient = require('./models/patient');

const MONGO_URI = process.env.MONGO_URI;

async function getVideoCallInfo() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to database\n');

    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Find today's appointments for patient
    const appointments = await Appointment.find({
      appointmentDate: {
        $gte: today,
        $lt: tomorrow
      }
    })
    .populate('doctorId', 'firstName lastName')
    .populate('patientId', 'firstName lastName')
    .sort({ startTime: 1 });

    console.log(`Found ${appointments.length} appointment(s) for today:\n`);

    for (const apt of appointments) {
      console.log('─'.repeat(60));
      console.log(`Doctor: Dr. ${apt.doctorId.firstName} ${apt.doctorId.lastName}`);
      console.log(`Patient: ${apt.patientId.firstName} ${apt.patientId.lastName}`);
      console.log(`Time: ${apt.startTime} - ${apt.endTime}`);
      console.log(`Status: ${apt.status}`);
      console.log(`Type: ${apt.appointmentType}`);
      
      if (apt.roomUrl) {
        console.log(`\n🎥 VIDEO CALL URL: ${apt.roomUrl}`);
        console.log('\nYou can click this link to join the video call directly!');
      } else {
        console.log('\n⚠️  No video call room created for this appointment');
      }
      console.log('─'.repeat(60));
      console.log();

      // Update status to ongoing if it's time
      const now = new Date();
      const currentTime = now.toTimeString().slice(0, 5);
      
      if (apt.status === 'confirmed' && currentTime >= apt.startTime) {
        console.log('⏰ Updating appointment status to "ongoing"...');
        apt.status = 'ongoing';
        await apt.save();
        console.log('✅ Status updated! Refresh your browser to see the Join button.\n');
      }
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

getVideoCallInfo();

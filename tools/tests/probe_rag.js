const path = require('path');
const chat = require(path.join(__dirname, '..', '..', 'api', 'chat.js'));
const queries = [
  'how do I wipe a lost device',
  'block the camera',
  'kiosk exit pin',
  'enroll without qr',
  'what does the orange pill mean',
  'sync AE devices'
];
for (const q of queries) {
  const top = chat.retrieve(q, 3);
  console.log('Q:', q);
  top.forEach(e => console.log('   -', e.page + '#' + e.id, '|', e.text.slice(0, 90) + '...'));
}

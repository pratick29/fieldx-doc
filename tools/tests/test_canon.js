const path = require('path');
const chat = require(path.join(__dirname, '..', '..', 'api', 'chat.js'));
const CASES = [
  ['Can I disable Bluetooth?', 'bluetooth'],
  ['Where is the Bluetooth setting?', 'bluetooth'],
  ['How do I block Bluetooth?', 'bluetooth'],
  ['how do I wipe a lost device', 'actions-list'],
  ['block the camera', 'disallow-camera'],
  ['kiosk exit pin', 'kiosk-admin-password'],
  ['enroll without qr', 'web-installer', true],  // may surface alternatives; check top-6 contains a non-qr method
  ['what does the orange pill mean', 'ae-pills'],
  ['sync AE devices', 'sync-ae'],
  ['How do I configure Allow Bluetooth?', 'bluetooth'],
  ['contact support email', 'email-us'],
  ['staged rollout firmware', 'staged-rollouts'],
];
let pass = 0, fail = 0;
for (const [q, want, loose] of CASES) {
  const top = chat.retrieve(q, 6);
  const ids = top.map(e => e.page + '#' + e.id).join(' ');
  const ok = loose
    ? /web-installer|manual-adb|app-installer|before-you-start|step-4-connect-and-enrol|step-3-prepare-your-computer/.test(ids)
    : new RegExp(want).test(top.slice(0, 3).map(e => e.page + '#' + e.id).join(' '));
  if (ok) { pass++; }
  else { fail++; console.log('MISS:', JSON.stringify(q), 'want ~' + want, '\n  got:', top.slice(0, 3).map(e => e.page + '#' + e.id).join(' | ')); }
}
console.log(`canonical: ${pass} passed, ${fail} failed`);
if (fail > 2) process.exit(1);

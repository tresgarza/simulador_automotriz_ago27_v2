// Debug script para entender el cálculo de días
const d1 = new Date('2025-08-11');
const d2 = new Date('2025-08-15');

console.log('From:', d1.toISOString().slice(0, 10));
console.log('To:', d2.toISOString().slice(0, 10));

const ms = d2.getTime() - d1.getTime();
const days = ms / (1000 * 60 * 60 * 24);
console.log('Days between:', days);

// Calculation check
const principal = 284130;
const tan = 0.45;
const days4 = 4;
const days5 = 5;

const interest4 = principal * (tan / 360) * days4;
const interest5 = principal * (tan / 360) * days5;

console.log('Interest with 4 days:', interest4);
console.log('Interest with 5 days:', interest5);
console.log('Test shows:', 1775.81);





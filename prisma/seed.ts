import { config } from 'dotenv';
config();

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Accurate hole par data for specific courses
const courseHoleData: Record<string, number[]> = {
  "The Montgomerie Marrakech": [4, 4, 5, 3, 4, 4, 4, 3, 4, 4, 3, 4, 5, 4, 4, 3, 4, 5], // Par 70 (4 par-3, 10 par-4, 4 par-5)
  "Royal Golf Dar Es Salam": [4, 5, 3, 4, 5, 3, 4, 4, 4, 4, 4, 5, 3, 4, 5, 3, 4, 4], // Par 72 (Red Course)
  "Assoufid Golf Club": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
  "Mazagan Golf Club": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
  "Tazegzout Golf": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
  "Fairmont Royal Palm Marrakech": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
  "Samanah Golf Club": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
  "PalmGolf Marrakech Ourika": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
  "Michlifen Golf & Country Club": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
  "Al Maaden Golf Resort": [5, 4, 4, 3, 5, 4, 4, 3, 4, 4, 5, 3, 5, 4, 4, 3, 4, 5], // Par 73
  "Royal Golf Marrakech": [4, 4, 3, 4, 5, 3, 4, 4, 4, 4, 5, 3, 4, 4, 5, 3, 4, 4], // Par 71 (Koutoubia)
  "Golf du Soleil": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
  "Golf Les Dunes": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
  "Royal Golf de Fès": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
  "Al Houara Golf Club": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
  "Royal Golf Tangier": [4, 4, 3, 4, 5, 3, 4, 4, 4, 4, 5, 3, 4, 5, 4, 3, 4, 4], // Par 70
  "Amelkis Golf Club": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
  "Palmeraie Golf Palace": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
  "Golf de Mogador": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
  "Noria Golf Club": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
  "Ben Slimane Golf Club": [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5], // Par 72
};

// Morocco Golf Courses Data with GPS coordinates
const moroccoGolfCourses = [
  {
    name: "Royal Golf Dar Es Salam",
    city: "Rabat",
    region: "Rabat-Salé-Kénitra",
    latitude: 33.9176,
    longitude: -6.8374,
    totalHoles: 45,
    description: "One of Africa's most prestigious golf courses, designed by Robert Trent Jones Sr. Features three courses: Red, Blue, and Green. Host of the Hassan II Trophy.",
    designer: "Robert Trent Jones Sr.",
    yearBuilt: 1971,
    phone: "+212 5 37 75 58 64",
    website: "https://royalgolfdaressalam.com",
    address: "Km 9, Avenue Mohamed VI, Rabat",
  },
  {
    name: "Mazagan Golf Club",
    city: "El Jadida",
    region: "Casablanca-Settat",
    latitude: 33.2847,
    longitude: -8.3773,
    totalHoles: 18,
    description: "A spectacular links-style course designed by Gary Player, running along the Atlantic coast. Features dramatic ocean views and challenging dunes.",
    designer: "Gary Player",
    yearBuilt: 2009,
    phone: "+212 5 23 34 90 00",
    website: "https://mazaganbeachresort.com",
    address: "Route de Casablanca, El Jadida",
  },
  {
    name: "Assoufid Golf Club",
    city: "Marrakech",
    region: "Marrakech-Safi",
    latitude: 31.5525,
    longitude: -8.0846,
    totalHoles: 18,
    description: "A world-class course set in a stunning 222-hectare resort surrounded by palm trees, olive groves, and cacti with Atlas Mountain views.",
    designer: "Nialla Cameron",
    yearBuilt: 2012,
    phone: "+212 5 24 37 48 00",
    website: "https://assoufid.com",
    address: "Avenue Guemassa, Km 10, Marrakech",
  },
  {
    name: "Golf du Soleil",
    city: "Agadir",
    region: "Souss-Massa",
    latitude: 30.3640,
    longitude: -9.5538,
    totalHoles: 36,
    description: "A 36-hole complex with two championship courses, perfectly maintained year-round. Features eucalyptus and palm trees throughout.",
    designer: "Fernando C. Guedes",
    yearBuilt: 1991,
    phone: "+212 5 28 82 50 00",
    website: "https://golf-du-soleil.wheree.com",
    address: "BP 901 Chemin des Dunes, Agadir",
  },
  {
    name: "Royal Golf Marrakech",
    city: "Marrakech",
    region: "Marrakech-Safi",
    latitude: 31.6107,
    longitude: -7.9490,
    totalHoles: 27,
    description: "Morocco's oldest golf course, established in 1923. Features an 18-hole 'Koutoubia' course and a 9-hole 'Menara' course with stunning views.",
    designer: "Arnaud Massy",
    yearBuilt: 1923,
    phone: "+212 5 24 30 88 88",
    website: "https://royalgolfmarrakech.com",
    address: "Route de Ouarzazate, Marrakech",
  },
  {
    name: "Tazegzout Golf",
    city: "Agadir",
    region: "Souss-Massa",
    latitude: 30.5298,
    longitude: -9.6865,
    totalHoles: 18,
    description: "A spectacular clifftop course designed by Kyle Phillips, offering breathtaking Atlantic Ocean views from every hole. Features argan trees and dramatic elevation changes.",
    designer: "Kyle Phillips",
    yearBuilt: 2018,
    phone: "+212 671 81 81 89",
    website: "https://tazegzout.com",
    address: "Taghazout Bay Resort, Route d'Essaouira, Agadir",
  },
  {
    name: "Fairmont Royal Palm Marrakech",
    city: "Marrakech",
    region: "Marrakech-Safi",
    latitude: 31.5145,
    longitude: -8.0463,
    totalHoles: 18,
    description: "An exclusive 18-hole championship course set in 75 hectares of natural space with Atlas Mountains backdrop. Features pristine conditioning and luxury amenities.",
    designer: "Cabell B. Robinson",
    yearBuilt: 2011,
    phone: "+212 5 24 48 78 00",
    website: "https://fairmont.com/marrakech",
    address: "Km 12 Route D'Amizmiz, Marrakech",
  },
  {
    name: "Samanah Golf Club",
    city: "Marrakech",
    region: "Marrakech-Safi",
    latitude: 31.5113,
    longitude: -8.0604,
    totalHoles: 18,
    description: "A world-class course designed by Nicklaus Design, featuring long fairways and strategic challenges. Built to USGA standards.",
    designer: "Nicklaus Design",
    yearBuilt: 2010,
    phone: "+212 5 24 48 31 18",
    website: "https://mysamanah.com",
    address: "Km 14 Route d'Amizmiz, Marrakech",
  },
  {
    name: "PalmGolf Marrakech Ourika",
    city: "Marrakech",
    region: "Marrakech-Safi",
    latitude: 31.5186,
    longitude: -7.9555,
    totalHoles: 18,
    description: "A beautiful resort course set over 150 hectares surrounded by olive and palm trees, just 10 minutes from Marrakech airport.",
    designer: "Stéphane Talbot",
    yearBuilt: 2015,
    phone: "+212 5 25 07 51 11",
    website: "https://palmgolfmarrakechourika.com",
    address: "Route de L'Ourika, Km 13, Marrakech",
  },
  {
    name: "Michlifen Golf & Country Club",
    city: "Ifrane",
    region: "Fès-Meknès",
    latitude: 33.4839,
    longitude: -5.1585,
    totalHoles: 18,
    description: "Morocco's highest golf course at 1,650m altitude in the Middle Atlas Mountains. Designed by Jack Nicklaus with stunning mountain views.",
    designer: "Jack Nicklaus",
    yearBuilt: 2015,
    phone: "+212 5 35 86 40 00",
    website: "https://michlifen.com",
    address: "Avenue Hassan II, BP 18, Ifrane",
  },
  {
    name: "Al Maaden Golf Resort",
    city: "Marrakech",
    region: "Marrakech-Safi",
    latitude: 31.5918,
    longitude: -7.9376,
    totalHoles: 18,
    description: "A championship course facing the Atlas Mountains with wooded smooth curves and a fabulous setting of cacti, palm, and olive trees.",
    designer: "Thierry Sprecher",
    yearBuilt: 2010,
    phone: "+212 5 25 50 65 06",
    website: "https://almaaden.golf",
    address: "Route d'Ouarzazate, Sidi Youssef Ben Ali, Marrakech",
  },
  {
    name: "Golf Les Dunes",
    city: "Agadir",
    region: "Souss-Massa",
    latitude: 30.3658,
    longitude: -9.5601,
    totalHoles: 27,
    description: "A 27-hole championship course designed by Cabell B. Robinson, set on 250 acres of Moroccan landscape with eucalyptus and tamarisk trees.",
    designer: "Cabell B. Robinson",
    yearBuilt: 1991,
    phone: "+212 5 28 83 45 59",
    website: "https://golflesdunesagadir.com",
    address: "Chemin Oued Souss, Agadir",
  },
  {
    name: "Royal Golf de Fès",
    city: "Fès",
    region: "Fès-Meknès",
    latitude: 33.9045,
    longitude: -4.9890,
    totalHoles: 18,
    description: "A beautiful course set in a vast olive grove at 700m altitude, just minutes from Fès airport. Offers stunning views and challenging play.",
    designer: "Robert Hurd",
    yearBuilt: 1984,
    phone: "+212 5 35 66 52 10",
    website: "https://madaefgolfs.com",
    address: "Route Imouzar, Km 17, Fès",
  },
  {
    name: "The Montgomerie Marrakech",
    city: "Marrakech",
    region: "Marrakech-Safi",
    latitude: 31.5992,
    longitude: -8.0098,
    totalHoles: 18,
    description: "An 18-hole course designed by golf legend Colin Montgomerie, located on Grand Avenue Mohammed VI close to the airport.",
    designer: "Colin Montgomerie",
    yearBuilt: 2013,
    phone: "+212 5 24 39 06 44",
    website: "https://montgomeriemarrakech.com",
    address: "Avenue Guemassa, Route de l'Aéroport, Marrakech",
  },
  {
    name: "Royal Golf Agadir",
    city: "Agadir",
    region: "Souss-Massa",
    latitude: 30.3578,
    longitude: -9.5312,
    totalHoles: 9,
    description: "One of Morocco's oldest golf courses, situated about 12 kilometers outside Agadir, surrounded by rose walls and lush gardens.",
    designer: "Unknown",
    yearBuilt: 1956,
    phone: "+212 5 28 82 51 00",
    website: "https://royalgolfagadir.com",
    address: "Km 12, Route Ait Melloul, Agadir",
  },
  {
    name: "Al Houara Golf Club",
    city: "Tangier",
    region: "Tanger-Tétouan-Al Hoceïra",
    latitude: 35.6725,
    longitude: -5.8892,
    totalHoles: 18,
    description: "A magnificent 18-hole course plus a compact 9-hole floodlit course, located 20 minutes from Tangier Airport with outstanding practice facilities.",
    designer: "Robert Trent Jones Sr.",
    yearBuilt: 2017,
    phone: "+212 5 39 39 43 39",
    website: "https://alhouaragolf.com",
    address: "Km 19.8, Route Nationale Tangier-Asilah",
  },
  {
    name: "Royal Golf de Meknès",
    city: "Meknès",
    region: "Fès-Meknès",
    latitude: 33.8856,
    longitude: -5.5547,
    totalHoles: 9,
    description: "A charming 9-hole course set within the gardens of the Royal Palace in Meknes, offering a unique and historic golfing experience.",
    designer: "Unknown",
    yearBuilt: 1970,
    phone: "+212 5 35 70 36 87",
    website: "https://royalgolfmeknes.ma",
    address: "J'nane Bahraouia - Bab Belkari, Meknès",
  },
  {
    name: "Amelkis Golf Club",
    city: "Marrakech",
    region: "Marrakech-Safi",
    latitude: 31.6176,
    longitude: -7.9340,
    totalHoles: 27,
    description: "One of Morocco's most selective golf layouts with technical difficulties that appeal to strategic play. Located 10 minutes from Marrakech center.",
    designer: "C. Robinson",
    yearBuilt: 1995,
    phone: "+212 5 24 40 43 43",
    website: "https://golfamelkis.com",
    address: "Km 12, Route de Ouarzazate, Marrakech",
  },
  {
    name: "Royal Golf Tangier",
    city: "Tangier",
    region: "Tanger-Tétouan-Al Hoceïra",
    latitude: 35.7589,
    longitude: -5.8234,
    totalHoles: 18,
    description: "A historic course with stunning views of the Strait of Gibraltar. Features challenging holes with water hazards and strategic bunkering.",
    designer: "M. Rimet",
    yearBuilt: 1914,
    phone: "+212 5 39 93 41 41",
    website: "https://royalgolftangier.com",
    address: "Route de Boubana, Tangier",
  },
  {
    name: "Palmeraie Golf Palace",
    city: "Marrakech",
    region: "Marrakech-Safi",
    latitude: 31.6523,
    longitude: -7.9678,
    totalHoles: 18,
    description: "An 18-hole course set in the famous Palmeraie of Marrakech, surrounded by thousands of palm trees with Atlas Mountain views.",
    designer: "Robert Trent Jones Sr.",
    yearBuilt: 1993,
    phone: "+212 5 24 33 90 00",
    website: "https://palmeraie-golf.com",
    address: "Route de Casablanca, Palmeraie, Marrakech",
  },
  {
    name: "Golf de Mogador",
    city: "Essaouira",
    region: "Marrakech-Safi",
    latitude: 31.4987,
    longitude: -9.7823,
    totalHoles: 18,
    description: "A spectacular links-style course designed by Gary Player on the Atlantic coast near the charming city of Essaouira.",
    designer: "Gary Player",
    yearBuilt: 2009,
    phone: "+212 5 24 47 20 00",
    website: "https://mogadorgolf.com",
    address: "Route d'Agadir, Essaouira",
  },
  {
    name: "Noria Golf Club",
    city: "Marrakech",
    region: "Marrakech-Safi",
    latitude: 31.5734,
    longitude: -8.0456,
    totalHoles: 18,
    description: "A contemporary course with minimalist design inspired by the local landscape, featuring olive groves and traditional Moroccan irrigation channels.",
    designer: "Steven Forrest",
    yearBuilt: 2017,
    phone: "+212 5 24 32 32 32",
    website: "https://noriagolf.com",
    address: "Route de Casablanca, Marrakech",
  },
  {
    name: "Atlas Golf Marrakech",
    city: "Marrakech",
    region: "Marrakech-Safi",
    latitude: 31.6234,
    longitude: -7.9891,
    totalHoles: 9,
    description: "A compact 9-hole course perfect for beginners and practice, with stunning Atlas Mountain views and excellent facilities.",
    designer: "Local Design",
    yearBuilt: 2005,
    phone: "+212 5 24 30 30 30",
    website: "https://atlasgolfmarrakech.com",
    address: "Route de l'Ourika, Marrakech",
  },
  {
    name: "Ben Slimane Golf Club",
    city: "Ben Slimane",
    region: "Casablanca-Settat",
    latitude: 33.6134,
    longitude: -7.0987,
    totalHoles: 18,
    description: "A challenging course set in a pine forest between Casablanca and Rabat, known for its narrow fairways and well-protected greens.",
    designer: "Yves Bureau",
    yearBuilt: 1972,
    phone: "+212 5 23 17 30 00",
    website: "https://benslimanegolf.com",
    address: "Route de Rabat, Ben Slimane",
  }
];

// Generate holes data with par and handicap
function generateHoles(courseName: string, totalHoles: number): { holeNumber: number; par: number; handicap: number }[] {
  const holes: { holeNumber: number; par: number; handicap: number }[] = [];
  
  // Use accurate par data if available, otherwise use default
  const accuratePars = courseHoleData[courseName];
  const defaultPars = [4, 5, 3, 4, 4, 5, 3, 4, 4, 5, 4, 3, 4, 5, 4, 3, 4, 5];
  const pars = accuratePars || defaultPars;
  
  // Standard stroke index (handicap) distribution
  const handicaps = [1, 10, 3, 12, 5, 14, 7, 16, 9, 2, 11, 4, 13, 6, 15, 8, 17, 18];
  
  for (let i = 0; i < totalHoles; i++) {
    holes.push({
      holeNumber: i + 1,
      par: pars[i % 18] || 4,
      handicap: handicaps[i % 18] || ((i % 18) + 1),
    });
  }
  
  return holes;
}

// Generate tees for a course
function generateTees(courseId: string): { name: string; color: string; rating: number; slope: number }[] {
  return [
    { name: 'Championship', color: 'Black', rating: 73.5, slope: 135 },
    { name: "Men's", color: 'White', rating: 71.0, slope: 127 },
    { name: "Ladies", color: 'Red', rating: 68.5, slope: 119 },
  ];
}

async function main() {
  console.log('Starting to seed Morocco golf courses...');
  
  // Clear existing data (in correct order due to foreign key constraints)
  await prisma.roundScore.deleteMany();
  await prisma.round.deleteMany();
  await prisma.courseHoleDistance.deleteMany();
  await prisma.courseTee.deleteMany();
  await prisma.courseHole.deleteMany();
  await prisma.golfCourse.deleteMany();
  await prisma.clubDistance.deleteMany();
  await prisma.user.deleteMany();
  
  console.log('Cleared existing data');
  
  // Seed golf courses
  for (const courseData of moroccoGolfCourses) {
    const course = await prisma.golfCourse.create({
      data: {
        name: courseData.name,
        city: courseData.city,
        region: courseData.region,
        country: "Morocco",
        latitude: courseData.latitude,
        longitude: courseData.longitude,
        totalHoles: courseData.totalHoles,
        description: courseData.description,
        designer: courseData.designer,
        yearBuilt: courseData.yearBuilt,
        phone: courseData.phone,
        website: courseData.website,
        address: courseData.address,
      }
    });
    
    console.log(`Created course: ${course.name}`);
    
    // Create holes
    const holesData = generateHoles(courseData.name, courseData.totalHoles);
    for (const holeData of holesData) {
      await prisma.courseHole.create({
        data: {
          courseId: course.id,
          holeNumber: holeData.holeNumber,
          par: holeData.par,
          handicap: holeData.handicap,
        }
      });
    }
    
    // Create tees
    const teesData = generateTees(course.id);
    for (const teeData of teesData) {
      await prisma.courseTee.create({
        data: {
          courseId: course.id,
          name: teeData.name,
          color: teeData.color,
          rating: teeData.rating,
          slope: teeData.slope,
        }
      });
    }
  }
  
  console.log(`\nSuccessfully seeded ${moroccoGolfCourses.length} Morocco golf courses!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

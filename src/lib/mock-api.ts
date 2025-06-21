import { ItineraryItem, AgentType, TripDestination } from './types';

// Comprehensive list of Indian destinations organized by states/regions
export const mockDestinations: TripDestination[] = [
  // Maharashtra
  {
    id: '1',
    name: 'Mumbai',
    country: 'Maharashtra, India',
    coordinates: [19.0760, 72.8777],
  },
  {
    id: '2',
    name: 'Pune',
    country: 'Maharashtra, India',
    coordinates: [18.5204, 73.8567],
  },
  {
    id: '3',
    name: 'Nashik',
    country: 'Maharashtra, India',
    coordinates: [19.9975, 73.7898],
  },
  {
    id: '4',
    name: 'Aurangabad',
    country: 'Maharashtra, India',
    coordinates: [19.8762, 75.3433],
  },
  {
    id: '5',
    name: 'Nagpur',
    country: 'Maharashtra, India',
    coordinates: [21.1458, 79.0882],
  },
  {
    id: '6',
    name: 'Lonavala',
    country: 'Maharashtra, India',
    coordinates: [18.7537, 73.4068],
  },
  {
    id: '7',
    name: 'Mahabaleshwar',
    country: 'Maharashtra, India',
    coordinates: [17.9244, 73.6573],
  },
  {
    id: '8',
    name: 'Alibag',
    country: 'Maharashtra, India',
    coordinates: [18.6414, 72.8722],
  },

  // Karnataka
  {
    id: '9',
    name: 'Bengaluru',
    country: 'Karnataka, India',
    coordinates: [12.9716, 77.5946],
  },
  {
    id: '10',
    name: 'Mysore',
    country: 'Karnataka, India',
    coordinates: [12.2958, 76.6394],
  },
  {
    id: '11',
    name: 'Mangalore',
    country: 'Karnataka, India',
    coordinates: [12.9141, 74.8560],
  },
  {
    id: '12',
    name: 'Hubli',
    country: 'Karnataka, India',
    coordinates: [15.3647, 75.1240],
  },
  {
    id: '13',
    name: 'Coorg',
    country: 'Karnataka, India',
    coordinates: [12.3378, 75.8069],
  },
  {
    id: '14',
    name: 'Hampi',
    country: 'Karnataka, India',
    coordinates: [15.3350, 76.4600],
  },
  {
    id: '15',
    name: 'Chikmagalur',
    country: 'Karnataka, India',
    coordinates: [13.3161, 75.7720],
  },
  {
    id: '16',
    name: 'Udupi',
    country: 'Karnataka, India',
    coordinates: [13.3409, 74.7421],
  },

  // Goa
  {
    id: '17',
    name: 'Panaji',
    country: 'Goa, India',
    coordinates: [15.4909, 73.8278],
  },
  {
    id: '18',
    name: 'Goa',
    country: 'Goa, India',
    coordinates: [15.2993, 74.1240],
  },
  {
    id: '19',
    name: 'Calangute',
    country: 'Goa, India',
    coordinates: [15.5438, 73.7553],
  },
  {
    id: '20',
    name: 'Anjuna',
    country: 'Goa, India',
    coordinates: [15.5732, 73.7408],
  },
  {
    id: '21',
    name: 'Baga',
    country: 'Goa, India',
    coordinates: [15.5560, 73.7516],
  },

  // Delhi & NCR
  {
    id: '22',
    name: 'New Delhi',
    country: 'Delhi, India',
    coordinates: [28.6139, 77.2090],
  },
  {
    id: '23',
    name: 'Gurgaon',
    country: 'Haryana, India',
    coordinates: [28.4595, 77.0266],
  },
  {
    id: '24',
    name: 'Noida',
    country: 'Uttar Pradesh, India',
    coordinates: [28.5355, 77.3910],
  },
  {
    id: '25',
    name: 'Faridabad',
    country: 'Haryana, India',
    coordinates: [28.4089, 77.3178],
  },

  // Rajasthan
  {
    id: '26',
    name: 'Jaipur',
    country: 'Rajasthan, India',
    coordinates: [26.9124, 75.7873],
  },
  {
    id: '27',
    name: 'Udaipur',
    country: 'Rajasthan, India',
    coordinates: [24.5854, 73.7125],
  },
  {
    id: '28',
    name: 'Jodhpur',
    country: 'Rajasthan, India',
    coordinates: [26.2389, 73.0243],
  },
  {
    id: '29',
    name: 'Jaisalmer',
    country: 'Rajasthan, India',
    coordinates: [26.9157, 70.9083],
  },
  {
    id: '30',
    name: 'Pushkar',
    country: 'Rajasthan, India',
    coordinates: [26.4899, 74.5511],
  },
  {
    id: '31',
    name: 'Mount Abu',
    country: 'Rajasthan, India',
    coordinates: [24.5925, 72.7157],
  },
  {
    id: '32',
    name: 'Bikaner',
    country: 'Rajasthan, India',
    coordinates: [28.0229, 73.3119],
  },
  {
    id: '33',
    name: 'Ajmer',
    country: 'Rajasthan, India',
    coordinates: [26.4499, 74.6399],
  },

  // Tamil Nadu
  {
    id: '34',
    name: 'Chennai',
    country: 'Tamil Nadu, India',
    coordinates: [13.0827, 80.2707],
  },
  {
    id: '35',
    name: 'Coimbatore',
    country: 'Tamil Nadu, India',
    coordinates: [11.0168, 76.9558],
  },
  {
    id: '36',
    name: 'Madurai',
    country: 'Tamil Nadu, India',
    coordinates: [9.9252, 78.1198],
  },
  {
    id: '37',
    name: 'Ooty',
    country: 'Tamil Nadu, India',
    coordinates: [11.4064, 76.6932],
  },
  {
    id: '38',
    name: 'Kodaikanal',
    country: 'Tamil Nadu, India',
    coordinates: [10.2381, 77.4892],
  },
  {
    id: '39',
    name: 'Kanyakumari',
    country: 'Tamil Nadu, India',
    coordinates: [8.0883, 77.5385],
  },
  {
    id: '40',
    name: 'Pondicherry',
    country: 'Tamil Nadu, India',
    coordinates: [11.9416, 79.8083],
  },
  {
    id: '41',
    name: 'Thanjavur',
    country: 'Tamil Nadu, India',
    coordinates: [10.7870, 79.1378],
  },
  {
    id: '42',
    name: 'Rameswaram',
    country: 'Tamil Nadu, India',
    coordinates: [9.2876, 79.3129],
  },

  // Kerala
  {
    id: '43',
    name: 'Kochi',
    country: 'Kerala, India',
    coordinates: [9.9312, 76.2673],
  },
  {
    id: '44',
    name: 'Thiruvananthapuram',
    country: 'Kerala, India',
    coordinates: [8.5241, 76.9366],
  },
  {
    id: '45',
    name: 'Munnar',
    country: 'Kerala, India',
    coordinates: [10.0889, 77.0595],
  },
  {
    id: '46',
    name: 'Alleppey',
    country: 'Kerala, India',
    coordinates: [9.4981, 76.3388],
  },
  {
    id: '47',
    name: 'Kumarakom',
    country: 'Kerala, India',
    coordinates: [9.6177, 76.4384],
  },
  {
    id: '48',
    name: 'Thekkady',
    country: 'Kerala, India',
    coordinates: [9.5938, 77.1593],
  },
  {
    id: '49',
    name: 'Varkala',
    country: 'Kerala, India',
    coordinates: [8.7379, 76.7164],
  },
  {
    id: '50',
    name: 'Wayanad',
    country: 'Kerala, India',
    coordinates: [11.6854, 76.1320],
  },
  {
    id: '51',
    name: 'Kovalam',
    country: 'Kerala, India',
    coordinates: [8.4004, 76.9784],
  },

  // Uttar Pradesh
  {
    id: '52',
    name: 'Agra',
    country: 'Uttar Pradesh, India',
    coordinates: [27.1767, 78.0081],
  },
  {
    id: '53',
    name: 'Lucknow',
    country: 'Uttar Pradesh, India',
    coordinates: [26.8467, 80.9462],
  },
  {
    id: '54',
    name: 'Varanasi',
    country: 'Uttar Pradesh, India',
    coordinates: [25.3176, 82.9739],
  },
  {
    id: '55',
    name: 'Mathura',
    country: 'Uttar Pradesh, India',
    coordinates: [27.4924, 77.6737],
  },
  {
    id: '56',
    name: 'Vrindavan',
    country: 'Uttar Pradesh, India',
    coordinates: [27.5820, 77.7000],
  },
  {
    id: '57',
    name: 'Ayodhya',
    country: 'Uttar Pradesh, India',
    coordinates: [26.7922, 82.1998],
  },
  {
    id: '58',
    name: 'Allahabad',
    country: 'Uttar Pradesh, India',
    coordinates: [25.4358, 81.8463],
  },
  {
    id: '59',
    name: 'Kanpur',
    country: 'Uttar Pradesh, India',
    coordinates: [26.4499, 80.3319],
  },

  // West Bengal
  {
    id: '60',
    name: 'Kolkata',
    country: 'West Bengal, India',
    coordinates: [22.5726, 88.3639],
  },
  {
    id: '61',
    name: 'Darjeeling',
    country: 'West Bengal, India',
    coordinates: [27.0360, 88.2627],
  },
  {
    id: '62',
    name: 'Siliguri',
    country: 'West Bengal, India',
    coordinates: [26.7271, 88.3953],
  },
  {
    id: '63',
    name: 'Durgapur',
    country: 'West Bengal, India',
    coordinates: [23.5204, 87.3119],
  },
  {
    id: '64',
    name: 'Howrah',
    country: 'West Bengal, India',
    coordinates: [22.5958, 88.2636],
  },
  {
    id: '65',
    name: 'Kalimpong',
    country: 'West Bengal, India',
    coordinates: [27.0669, 88.4685],
  },

  // Gujarat
  {
    id: '66',
    name: 'Ahmedabad',
    country: 'Gujarat, India',
    coordinates: [23.0225, 72.5714],
  },
  {
    id: '67',
    name: 'Surat',
    country: 'Gujarat, India',
    coordinates: [21.1702, 72.8311],
  },
  {
    id: '68',
    name: 'Vadodara',
    country: 'Gujarat, India',
    coordinates: [22.3072, 73.1812],
  },
  {
    id: '69',
    name: 'Rajkot',
    country: 'Gujarat, India',
    coordinates: [22.3039, 70.8022],
  },
  {
    id: '70',
    name: 'Kutch',
    country: 'Gujarat, India',
    coordinates: [23.7337, 69.8597],
  },
  {
    id: '71',
    name: 'Dwarka',
    country: 'Gujarat, India',
    coordinates: [22.2394, 68.9678],
  },
  {
    id: '72',
    name: 'Somnath',
    country: 'Gujarat, India',
    coordinates: [20.8880, 70.4017],
  },
  {
    id: '73',
    name: 'Gir',
    country: 'Gujarat, India',
    coordinates: [21.1247, 70.7729],
  },

  // Himachal Pradesh
  {
    id: '74',
    name: 'Shimla',
    country: 'Himachal Pradesh, India',
    coordinates: [31.1048, 77.1734],
  },
  {
    id: '75',
    name: 'Manali',
    country: 'Himachal Pradesh, India',
    coordinates: [32.2432, 77.1892],
  },
  {
    id: '76',
    name: 'Dharamshala',
    country: 'Himachal Pradesh, India',
    coordinates: [32.2190, 76.3234],
  },
  {
    id: '77',
    name: 'Kasauli',
    country: 'Himachal Pradesh, India',
    coordinates: [30.8978, 76.9653],
  },
  {
    id: '78',
    name: 'Dalhousie',
    country: 'Himachal Pradesh, India',
    coordinates: [32.5448, 75.9442],
  },
  {
    id: '79',
    name: 'Kullu',
    country: 'Himachal Pradesh, India',
    coordinates: [31.9578, 77.1092],
  },
  {
    id: '80',
    name: 'Spiti',
    country: 'Himachal Pradesh, India',
    coordinates: [32.2466, 78.0265],
  },
  {
    id: '81',
    name: 'Mcleodganj',
    country: 'Himachal Pradesh, India',
    coordinates: [32.2363, 76.3214],
  },

  // Punjab
  {
    id: '82',
    name: 'Chandigarh',
    country: 'Punjab, India',
    coordinates: [30.7333, 76.7794],
  },
  {
    id: '83',
    name: 'Amritsar',
    country: 'Punjab, India',
    coordinates: [31.6340, 74.8723],
  },
  {
    id: '84',
    name: 'Ludhiana',
    country: 'Punjab, India',
    coordinates: [30.9010, 75.8573],
  },
  {
    id: '85',
    name: 'Jalandhar',
    country: 'Punjab, India',
    coordinates: [31.3260, 75.5762],
  },

  // Haryana
  {
    id: '86',
    name: 'Kurukshetra',
    country: 'Haryana, India',
    coordinates: [29.9693, 76.8343],
  },
  {
    id: '87',
    name: 'Panipat',
    country: 'Haryana, India',
    coordinates: [29.3909, 76.9635],
  },

  // Uttarakhand
  {
    id: '88',
    name: 'Dehradun',
    country: 'Uttarakhand, India',
    coordinates: [30.3165, 78.0322],
  },
  {
    id: '89',
    name: 'Haridwar',
    country: 'Uttarakhand, India',
    coordinates: [29.9457, 78.1642],
  },
  {
    id: '90',
    name: 'Rishikesh',
    country: 'Uttarakhand, India',
    coordinates: [30.0869, 78.2676],
  },
  {
    id: '91',
    name: 'Nainital',
    country: 'Uttarakhand, India',
    coordinates: [29.3803, 79.4636],
  },
  {
    id: '92',
    name: 'Mussoorie',
    country: 'Uttarakhand, India',
    coordinates: [30.4598, 78.0664],
  },
  {
    id: '93',
    name: 'Jim Corbett',
    country: 'Uttarakhand, India',
    coordinates: [29.5316, 78.9463],
  },
  {
    id: '94',
    name: 'Auli',
    country: 'Uttarakhand, India',
    coordinates: [30.5204, 79.5685],
  },

  // Andhra Pradesh & Telangana
  {
    id: '95',
    name: 'Hyderabad',
    country: 'Telangana, India',
    coordinates: [17.3850, 78.4867],
  },
  {
    id: '96',
    name: 'Visakhapatnam',
    country: 'Andhra Pradesh, India',
    coordinates: [17.6868, 83.2185],
  },
  {
    id: '97',
    name: 'Vijayawada',
    country: 'Andhra Pradesh, India',
    coordinates: [16.5062, 80.6480],
  },
  {
    id: '98',
    name: 'Tirupati',
    country: 'Andhra Pradesh, India',
    coordinates: [13.6288, 79.4192],
  },
  {
    id: '99',
    name: 'Warangal',
    country: 'Telangana, India',
    coordinates: [17.9692, 79.5926],
  },

  // Odisha
  {
    id: '100',
    name: 'Bhubaneswar',
    country: 'Odisha, India',
    coordinates: [20.2961, 85.8245],
  },
  {
    id: '101',
    name: 'Puri',
    country: 'Odisha, India',
    coordinates: [19.8135, 85.8312],
  },
  {
    id: '102',
    name: 'Cuttack',
    country: 'Odisha, India',
    coordinates: [20.4625, 85.8828],
  },
  {
    id: '103',
    name: 'Konark',
    country: 'Odisha, India',
    coordinates: [19.8876, 86.0943],
  },

  // Madhya Pradesh
  {
    id: '104',
    name: 'Bhopal',
    country: 'Madhya Pradesh, India',
    coordinates: [23.2599, 77.4126],
  },
  {
    id: '105',
    name: 'Indore',
    country: 'Madhya Pradesh, India',
    coordinates: [22.7196, 75.8577],
  },
  {
    id: '106',
    name: 'Gwalior',
    country: 'Madhya Pradesh, India',
    coordinates: [26.2183, 78.1828],
  },
  {
    id: '107',
    name: 'Ujjain',
    country: 'Madhya Pradesh, India',
    coordinates: [23.1793, 75.7849],
  },
  {
    id: '108',
    name: 'Khajuraho',
    country: 'Madhya Pradesh, India',
    coordinates: [24.8318, 79.9199],
  },
  {
    id: '109',
    name: 'Jabalpur',
    country: 'Madhya Pradesh, India',
    coordinates: [23.1815, 79.9864],
  },
  {
    id: '110',
    name: 'Pachmarhi',
    country: 'Madhya Pradesh, India',
    coordinates: [22.4676, 78.4336],
  },

  // Bihar & Jharkhand
  {
    id: '111',
    name: 'Patna',
    country: 'Bihar, India',
    coordinates: [25.5941, 85.1376],
  },
  {
    id: '112',
    name: 'Gaya',
    country: 'Bihar, India',
    coordinates: [24.7914, 85.0002],
  },
  {
    id: '113',
    name: 'Bodhgaya',
    country: 'Bihar, India',
    coordinates: [24.6956, 84.9914],
  },
  {
    id: '114',
    name: 'Ranchi',
    country: 'Jharkhand, India',
    coordinates: [23.3441, 85.3096],
  },
  {
    id: '115',
    name: 'Jamshedpur',
    country: 'Jharkhand, India',
    coordinates: [22.8046, 86.2029],
  },

  // Assam & Northeast
  {
    id: '116',
    name: 'Guwahati',
    country: 'Assam, India',
    coordinates: [26.1445, 91.7362],
  },
  {
    id: '117',
    name: 'Shillong',
    country: 'Meghalaya, India',
    coordinates: [25.5788, 91.8933],
  },
  {
    id: '118',
    name: 'Gangtok',
    country: 'Sikkim, India',
    coordinates: [27.3389, 88.6065],
  },
  {
    id: '119',
    name: 'Itanagar',
    country: 'Arunachal Pradesh, India',
    coordinates: [27.0844, 93.6053],
  },
  {
    id: '120',
    name: 'Imphal',
    country: 'Manipur, India',
    coordinates: [24.8170, 93.9368],
  },
  {
    id: '121',
    name: 'Aizawl',
    country: 'Mizoram, India',
    coordinates: [23.7271, 92.7176],
  },
  {
    id: '122',
    name: 'Agartala',
    country: 'Tripura, India',
    coordinates: [23.8315, 91.2868],
  },
  {
    id: '123',
    name: 'Kohima',
    country: 'Nagaland, India',
    coordinates: [25.6751, 94.1086],
  },

  // Jammu & Kashmir / Ladakh
  {
    id: '124',
    name: 'Srinagar',
    country: 'Jammu & Kashmir, India',
    coordinates: [34.0837, 74.7973],
  },
  {
    id: '125',
    name: 'Jammu',
    country: 'Jammu & Kashmir, India',
    coordinates: [32.7266, 74.8570],
  },
  {
    id: '126',
    name: 'Leh',
    country: 'Ladakh, India',
    coordinates: [34.1526, 77.5770],
  },
  {
    id: '127',
    name: 'Kargil',
    country: 'Ladakh, India',
    coordinates: [34.5539, 76.1059],
  },
  {
    id: '128',
    name: 'Gulmarg',
    country: 'Jammu & Kashmir, India',
    coordinates: [34.0484, 74.3804],
  },
  {
    id: '129',
    name: 'Pahalgam',
    country: 'Jammu & Kashmir, India',
    coordinates: [34.0161, 75.3334],
  },

  // Union Territories
  {
    id: '130',
    name: 'Port Blair',
    country: 'Andaman & Nicobar, India',
    coordinates: [11.6234, 92.7265],
  },
  {
    id: '131',
    name: 'Kavaratti',
    country: 'Lakshadweep, India',
    coordinates: [10.5669, 72.6420],
  },
  {
    id: '132',
    name: 'Silvassa',
    country: 'Dadra & Nagar Haveli, India',
    coordinates: [20.2738, 73.0135],
  },
  {
    id: '133',
    name: 'Daman',
    country: 'Daman & Diu, India',
    coordinates: [20.3974, 72.8328],
  },
];

// Search function for destinations with enhanced Indian context
export const searchDestinations = (query: string): TripDestination[] => {
  if (!query || query.length < 2) return [];
  
  const lowerQuery = query.toLowerCase();
  
  // Handle common aliases and alternate names
  const aliases: Record<string, string[]> = {
    'bengaluru': ['bangalore', 'bengaluru', 'blr'],
    'bangalore': ['bengaluru', 'bangalore', 'blr'],
    'mumbai': ['bombay', 'mumbai', 'bom'],
    'bombay': ['mumbai', 'bombay', 'bom'],
    'kolkata': ['calcutta', 'kolkata', 'cal'],
    'calcutta': ['kolkata', 'calcutta', 'cal'],
    'chennai': ['madras', 'chennai', 'maa'],
    'madras': ['chennai', 'madras', 'maa'],
    'thiruvananthapuram': ['trivandrum', 'thiruvananthapuram'],
    'trivandrum': ['thiruvananthapuram', 'trivandrum'],
    'kochi': ['cochin', 'kochi', 'ernakulam'],
    'cochin': ['kochi', 'cochin', 'ernakulam'],
    'vishakhapatnam': ['vizag', 'visakhapatnam', 'vishakhapatnam'],
    'vizag': ['visakhapatnam', 'vizag', 'vishakhapatnam'],
    'new delhi': ['delhi', 'new delhi', 'ncr'],
    'delhi': ['new delhi', 'delhi', 'ncr'],
    'pondicherry': ['puducherry', 'pondicherry', 'pondy'],
    'puducherry': ['pondicherry', 'puducherry', 'pondy'],
    'goa': ['panaji', 'goa', 'north goa', 'south goa'],
    'panaji': ['goa', 'panaji', 'panjim'],
  };

  // Check if query matches any alias
  const expandedQueries = [lowerQuery];
  for (const [key, values] of Object.entries(aliases)) {
    if (values.includes(lowerQuery)) {
      expandedQueries.push(...values);
      break;
    }
  }

  const results = mockDestinations
    .filter(destination => {
      const name = destination.name.toLowerCase();
      const country = destination.country.toLowerCase();
      
      // Check against all expanded queries
      return expandedQueries.some(query => 
        name.includes(query) || country.includes(query)
      );
    })
    .sort((a, b) => {
      // Prioritize exact matches at the start
      const aNameMatch = expandedQueries.some(query => 
        a.name.toLowerCase().startsWith(query)
      );
      const bNameMatch = expandedQueries.some(query => 
        b.name.toLowerCase().startsWith(query)
      );
      
      if (aNameMatch && !bNameMatch) return -1;
      if (!aNameMatch && bNameMatch) return 1;
      
      // Then prioritize popular destinations
      const popularCities = ['mumbai', 'delhi', 'bengaluru', 'bangalore', 'chennai', 'kolkata', 'hyderabad', 'pune', 'ahmedabad', 'jaipur', 'surat', 'lucknow', 'kanpur', 'nagpur', 'indore', 'thane', 'bhopal', 'visakhapatnam', 'pimpri', 'patna', 'vadodara', 'ghaziabad', 'ludhiana', 'agra', 'nashik', 'faridabad', 'meerut', 'rajkot', 'kalyan', 'vasai', 'varanasi', 'srinagar', 'aurangabad', 'dhanbad', 'amritsar', 'navi mumbai', 'allahabad', 'ranchi', 'howrah', 'coimbatore', 'jabalpur', 'gwalior', 'vijayawada', 'jodhpur', 'madurai', 'raipur', 'kota', 'guwahati', 'chandigarh', 'solapur', 'hubli', 'dharwad', 'bareilly', 'moradabad', 'mysore', 'gurgaon', 'aligarh', 'jalandhar', 'tiruchirappalli', 'bhubaneswar', 'salem', 'warangal', 'mira', 'bhayandar', 'thiruvananthapuram', 'bhiwandi', 'saharanpur', 'gorakhpur', 'guntur', 'bikaner', 'amravati', 'noida', 'jamshedpur', 'bhilai', 'cuttack', 'firozabad', 'kochi', 'bhavnagar', 'dehradun', 'durgapur', 'asansol', 'nanded', 'kolhapur', 'ajmer', 'gulbarga', 'jamnagar', 'ujjain', 'loni', 'siliguri', 'jhansi', 'ulhasnagar', 'nellore', 'jammu', 'sangli', 'miraj', 'kupwad', 'belgaum', 'mangalore', 'ambattur', 'tirunelveli', 'malegaon', 'gaya', 'jalgaon', 'udaipur', 'maheshtala'];
      
      const aPopular = popularCities.includes(a.name.toLowerCase());
      const bPopular = popularCities.includes(b.name.toLowerCase());
      
      if (aPopular && !bPopular) return -1;
      if (!aPopular && bPopular) return 1;
      
      // Finally sort alphabetically
      return a.name.localeCompare(b.name);
    })
    .slice(0, 12); // Increased to 12 results for better coverage

  return results;
};

// Mock API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Helper function to generate dates relative to today
const getRelativeDate = (daysFromNow: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split('T')[0];
};

// Mock agent responses
export const mockAgentResponses = {
  flights: [
    {
      id: `flight-${Date.now()}`,
      type: 'flight' as const,
      title: 'Emirates EK215',
      description: 'Direct flight, Premium Economy',
      date: getRelativeDate(7), // 7 days from now
      time: '14:30',
      duration: 480, // 8 hours
      location: 'Mumbai → Dubai',
      coordinates: [25.2532, 55.3657] as [number, number],
      price: 1250,
      currency: 'USD',
      status: 'pending' as const,
      rating: 4.5,
      details: {
        airline: 'Emirates',
        flightNumber: 'EK215',
        class: 'Premium Economy',
        departure: 'BOM Terminal 2',
        arrival: 'DXB Terminal 3',
        baggage: '2x23kg included',
      },
    },
    {
      id: `flight-${Date.now() + 1}`,
      type: 'flight' as const,
      title: 'Air India AI191',
      description: 'Direct flight, Economy',
      date: getRelativeDate(7),
      time: '23:45',
      duration: 240, // 4 hours
      location: 'Mumbai → Delhi',
      coordinates: [28.5562, 77.1000] as [number, number],
      price: 890,
      currency: 'USD',
      status: 'alternative' as const,
      rating: 4.2,
      details: {
        airline: 'Air India',
        flightNumber: 'AI191',
        class: 'Economy',
        departure: 'BOM Terminal 2',
        arrival: 'DEL Terminal 3',
        baggage: '1x23kg included',
      },
    },
  ],
  hotels: [
    {
      id: `hotel-${Date.now()}`,
      type: 'hotel' as const,
      title: 'The Taj Mahal Palace',
      description: 'Luxury heritage hotel overlooking the Arabian Sea',
      date: getRelativeDate(7),
      time: '15:00',
      duration: 1440, // 24 hours (full day)
      location: 'Colaba, Mumbai',
      coordinates: [18.9217, 72.8332] as [number, number],
      price: 450,
      currency: 'USD',
      status: 'pending' as const,
      imageUrl: '/api/placeholder/300/200',
      rating: 4.8,
      details: {
        checkIn: '15:00',
        checkOut: '11:00',
        roomType: 'Sea View Room',
        amenities: ['WiFi', 'Gym', 'Spa', 'Pool', 'Restaurant'],
        cancellation: 'Free until 24h before',
      },
    },
  ],
  dining: [
    {
      id: `dining-${Date.now()}`,
      type: 'meal' as const,
      title: 'Trishna',
      description: 'Award-winning seafood restaurant',
      date: getRelativeDate(8), // 8 days from now
      time: '19:30',
      duration: 120, // 2 hours
      location: 'Fort, Mumbai',
      coordinates: [18.9339, 72.8356] as [number, number],
      price: 80,
      currency: 'USD',
      status: 'pending' as const,
      rating: 4.7,
      details: {
        cuisine: 'Seafood, Indian',
        dressCode: 'Smart casual',
        dietary: ['Vegetarian options available'],
        reservation: 'Recommended',
      },
    },
    {
      id: `dining-${Date.now() + 1}`,
      type: 'meal' as const,
      title: 'Britannia & Co.',
      description: 'Historic Parsi cafe',
      date: getRelativeDate(9),
      time: '12:30',
      duration: 90, // 1.5 hours
      location: 'Ballard Estate, Mumbai',
      coordinates: [18.9322, 72.8417] as [number, number],
      price: 25,
      currency: 'USD',
      status: 'alternative' as const,
      rating: 4.5,
      details: {
        cuisine: 'Parsi, Iranian',
        dressCode: 'Casual',
        dietary: ['Non-vegetarian'],
        reservation: 'Not required',
      },
    },
  ],
  activities: [
    {
      id: `activity-${Date.now()}`,
      type: 'activity' as const,
      title: 'Gateway of India Tour',
      description: 'Guided heritage walk around the iconic monument',
      date: getRelativeDate(8),
      time: '10:00',
      duration: 180, // 3 hours
      location: 'Colaba, Mumbai',
      coordinates: [18.9220, 72.8347] as [number, number],
      price: 25,
      currency: 'USD',
      status: 'pending' as const,
      rating: 4.6,
      details: {
        category: 'Sightseeing',
        duration: '3 hours',
        includes: ['Guide', 'Entry tickets'],
        difficulty: 'Easy',
      },
    },
    {
      id: `activity-${Date.now() + 1}`,
      type: 'activity' as const,
      title: 'Elephanta Caves Excursion',
      description: 'Ferry ride and exploration of ancient cave temples',
      date: getRelativeDate(9),
      time: '09:00',
      duration: 300, // 5 hours
      location: 'Elephanta Island',
      coordinates: [18.9633, 72.9315] as [number, number],
      price: 40,
      currency: 'USD',
      status: 'alternative' as const,
      rating: 4.5,
      details: {
        category: 'Cultural Heritage',
        duration: '5 hours',
        includes: ['Ferry tickets', 'Guide', 'Entry fees'],
        difficulty: 'Moderate',
      },
    },
    {
      id: `activity-${Date.now() + 2}`,
      type: 'activity' as const,
      title: 'Mumbai Street Food Tour',
      description: 'Culinary adventure through local markets',
      date: getRelativeDate(8),
      time: '16:00',
      duration: 210, // 3.5 hours
      location: 'Various locations, Mumbai',
      coordinates: [19.0176, 72.8561] as [number, number],
      price: 35,
      currency: 'USD',
      status: 'pending' as const,
      rating: 4.8,
      details: {
        category: 'Food & Culture',
        duration: '3.5 hours',
        includes: ['Food tastings', 'Guide', 'Transport'],
        difficulty: 'Easy',
      },
    },
  ],
};

// Simulate agent API calls
export const callAgent = async (
  agentType: AgentType,
  query: string,
  preferences: any
): Promise<ItineraryItem[]> => {
  await delay(2000 + Math.random() * 3000); // Random delay 2-5 seconds
  
  const responses = mockAgentResponses[agentType];
  if (!responses) return [];
  
  // Simulate some randomness in results
  const shouldFail = Math.random() < 0.1; // 10% chance of failure
  if (shouldFail) {
    throw new Error(`${agentType} agent temporarily unavailable`);
  }
  
  return responses.slice(0, Math.ceil(Math.random() * responses.length));
};

// Simulate getting alternative options
export const getAlternatives = async (
  itemId: string,
  itemType: AgentType
): Promise<ItineraryItem[]> => {
  await delay(1500 + Math.random() * 2000);
  
  const responses = mockAgentResponses[itemType];
  return responses.filter(item => item.id !== itemId);
};

// Mock WebSocket hook (placeholder)
export const useWebSocket = (url: string) => {
  return {
    isConnected: false,
    sendMessage: (message: any) => {
      console.log('Mock WebSocket send:', message);
    },
    lastMessage: null,
  };
}; 
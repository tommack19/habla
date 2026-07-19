import { state } from "./core/state.js";
import { saveState, loadState } from "./core/storage.js";
import { renderPage } from "./core/router.js";
import { getCurrentXP, initializeProgressEngine } from "./core/progress.js";
import { completeMission as completeDailyMission } from "./core/missions.js";
import { contentReady, getCurrentLesson, setActiveLesson } from "./core/content.js";
import { consumeDueRecap, rememberLessonCompletion, scheduleLessonRecap } from "./core/lessonMemory.js";
import { renderNavigation } from "./ui/navigation.js";
import { CARLOS_FALLBACK_ONERROR, getCarlosAsset } from "./data/carlosAssets.js";

const PRACTICE_TOPIC_KEY = 'habla_selected_practice_topic_v1';
const PRACTICE_SESSION_KEY = 'habla_practice_session_v2';
const CARLOS_HISTORY_KEY = 'habla_carlos_history_v1';

console.log("Habla state loaded:", state);

const savedState = loadState();

if (savedState) {
  Object.assign(state, savedState);
  console.log("Saved Habla state restored:", state);
} else {
  console.log("No saved Habla state found. Starting fresh.");
}

saveState(state);
console.log("Habla profile loaded:", state.user);
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// VOCAB DATA
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
const VOCAB = [
  // GREETINGS
  {es:'hola',en:'hello',pos:'greeting',cat:'greetings',tip:'Works any time of day â€” the universal opener!',ex:'Â¡Hola! Â¿CÃ³mo estÃ¡s?',exEn:'Hello! How are you?'},
  {es:'adiÃ³s',en:'goodbye',pos:'greeting',cat:'greetings',tip:'Informal goodbye â€” also "hasta luego" (see you later)',ex:'Â¡AdiÃ³s! Â¡Hasta pronto!',exEn:'Goodbye! See you soon!'},
  {es:'buenos dÃ­as',en:'good morning',pos:'greeting',cat:'greetings',tip:'Use until noon, then switch to "buenas tardes".',ex:'Buenos dÃ­as, Â¿cÃ³mo le va?',exEn:'Good morning, how are you?'},
  {es:'buenas tardes',en:'good afternoon',pos:'greeting',cat:'greetings',tip:'Used from noon until sunset.',ex:'Buenas tardes, seÃ±or.',exEn:'Good afternoon, sir.'},
  {es:'buenas noches',en:'good evening / goodnight',pos:'greeting',cat:'greetings',tip:'Used both as a greeting at night and when going to bed.',ex:'Buenas noches, que descanses.',exEn:'Good night, rest well.'},
  {es:'gracias',en:'thank you',pos:'greeting',cat:'greetings',tip:'Add "muchas" to say "thank you very much".',ex:'Muchas gracias por tu ayuda.',exEn:'Thank you very much for your help.'},
  {es:'de nada',en:'you\'re welcome',pos:'greeting',cat:'greetings',tip:'Literally "of nothing" â€” the standard response to gracias.',ex:'â€” Gracias. â€” Â¡De nada!',exEn:'â€” Thank you. â€” You\'re welcome!'},
  {es:'por favor',en:'please',pos:'greeting',cat:'greetings',tip:'Goes at the end of a request â€” very polite.',ex:'Un cafÃ©, por favor.',exEn:'A coffee, please.'},
  {es:'lo siento',en:'I\'m sorry',pos:'greeting',cat:'greetings',tip:'For apologies. "PerdÃ³n" is more for bumping into someone.',ex:'Lo siento mucho, fue mi culpa.',exEn:'I\'m very sorry, it was my fault.'},
  {es:'con permiso',en:'excuse me (to pass)',pos:'greeting',cat:'greetings',tip:'Used when squeezing past someone or leaving a room.',ex:'Con permiso, Â¿puedo pasar?',exEn:'Excuse me, may I pass?'},
  {es:'Â¿cÃ³mo estÃ¡s?',en:'How are you? (informal)',pos:'phrase',cat:'greetings',tip:'Use with friends and family. "Â¿CÃ³mo estÃ¡ usted?" for strangers.',ex:'Â¡Hola! Â¿CÃ³mo estÃ¡s hoy?',exEn:'Hi! How are you today?'},
  {es:'bien, gracias',en:'fine, thank you',pos:'phrase',cat:'greetings',tip:'The classic answer â€” add "Â¿y tÃº?" to return the question.',ex:'Bien, gracias. Â¿Y tÃº?',exEn:'Fine, thanks. And you?'},
  {es:'mucho gusto',en:'nice to meet you',pos:'greeting',cat:'greetings',tip:'Said when introduced to someone for the first time.',ex:'Mucho gusto en conocerte.',exEn:'Nice to meet you.'},

  // VERBS
  {es:'ser',en:'to be (permanent)',pos:'verb',cat:'verbs',tip:'Identity, origin, profession, permanent traits.',ex:'Soy canadiense y soy alto.',exEn:'I am Canadian and I am tall.'},
  {es:'estar',en:'to be (temporary)',pos:'verb',cat:'verbs',tip:'Feelings, location, temporary states â€” ser vs estar is crucial!',ex:'Estoy muy cansado hoy.',exEn:'I am very tired today.'},
  {es:'tener',en:'to have',pos:'verb',cat:'verbs',tip:'Irregular! "tengo" not "teno". Used constantly in Spanish.',ex:'Tengo mucha hambre.',exEn:'I am very hungry (I have much hunger).'},
  {es:'ir',en:'to go',pos:'verb',cat:'verbs',tip:'"Voy a + verb" = easy future tense shortcut!',ex:'Voy al mercado maÃ±ana.',exEn:'I\'m going to the market tomorrow.'},
  {es:'hacer',en:'to do / to make',pos:'verb',cat:'verbs',tip:'Also used for weather: "hace calor" (it\'s hot).',ex:'Â¿QuÃ© haces este fin de semana?',exEn:'What are you doing this weekend?'},
  {es:'querer',en:'to want / to love',pos:'verb',cat:'verbs',tip:'Stem-changing: quiero, quieres, quiereâ€¦ Also means "to love" a person!',ex:'Quiero aprender espaÃ±ol.',exEn:'I want to learn Spanish.'},
  {es:'poder',en:'to be able to / can',pos:'verb',cat:'verbs',tip:'Stem-changing: puedo, puedes, puedeâ€¦',ex:'Â¿Puedes hablar mÃ¡s despacio?',exEn:'Can you speak more slowly?'},
  {es:'hablar',en:'to speak',pos:'verb',cat:'verbs',tip:'Regular -ar verb â€” the most common verb pattern.',ex:'Quiero hablar espaÃ±ol bien.',exEn:'I want to speak Spanish well.'},
  {es:'comer',en:'to eat',pos:'verb',cat:'verbs',tip:'Regular -er verb: como, comes, come, comemosâ€¦',ex:'Me gusta comer tacos.',exEn:'I like to eat tacos.'},
  {es:'vivir',en:'to live',pos:'verb',cat:'verbs',tip:'Regular -ir verb: vivo, vives, viveâ€¦',ex:'Vivo en Winnipeg, CanadÃ¡.',exEn:'I live in Winnipeg, Canada.'},
  {es:'saber',en:'to know (a fact)',pos:'verb',cat:'verbs',tip:'"Saber" = know facts. "Conocer" = know people/places.',ex:'No sÃ© hablar chino.',exEn:'I don\'t know how to speak Chinese.'},
  {es:'conocer',en:'to know (a person/place)',pos:'verb',cat:'verbs',tip:'Used for people, cities, experiences â€” not facts.',ex:'Â¿Conoces Madrid?',exEn:'Do you know Madrid?'},
  {es:'venir',en:'to come',pos:'verb',cat:'verbs',tip:'Irregular: vengo, vienes, vieneâ€¦',ex:'Â¿De dÃ³nde vienes?',exEn:'Where do you come from?'},
  {es:'dar',en:'to give',pos:'verb',cat:'verbs',tip:'Irregular first person: "doy" (I give).',ex:'Â¿Me das tu nÃºmero?',exEn:'Will you give me your number?'},
  {es:'ver',en:'to see / to watch',pos:'verb',cat:'verbs',tip:'Also used for watching TV: "ver la tele".',ex:'Me gusta ver pelÃ­culas.',exEn:'I like to watch movies.'},
  {es:'escuchar',en:'to listen',pos:'verb',cat:'verbs',tip:'Regular -ar verb. "Escucha" = listen! (command)',ex:'Escucha, tengo una idea.',exEn:'Listen, I have an idea.'},
  {es:'aprender',en:'to learn',pos:'verb',cat:'verbs',tip:'Regular -er verb. This is what you\'re doing right now!',ex:'Estoy aprendiendo espaÃ±ol.',exEn:'I am learning Spanish.'},

  // NOUNS
  {es:'la familia',en:'the family',pos:'noun',cat:'nouns',tip:'Your motivation for learning! "Familia" is similar to English.',ex:'Mi familia es muy importante.',exEn:'My family is very important.'},
  {es:'la esposa / el esposo',en:'wife / husband',pos:'noun',cat:'nouns',tip:'Also: "la mujer" (wife/woman), "el marido" (husband).',ex:'Mi esposa habla espaÃ±ol.',exEn:'My wife speaks Spanish.'},
  {es:'el hijo / la hija',en:'son / daughter',pos:'noun',cat:'nouns',tip:'"Los hijos" can mean sons OR children (mixed group).',ex:'Tengo dos hijos.',exEn:'I have two children.'},
  {es:'la casa',en:'the house',pos:'noun',cat:'nouns',tip:'"La" = feminine. Many -a words are feminine.',ex:'Mi casa es muy cÃ³moda.',exEn:'My house is very comfortable.'},
  {es:'el trabajo',en:'work / job',pos:'noun',cat:'nouns',tip:'"El" = masculine. Most -o words are masculine.',ex:'Voy al trabajo en coche.',exEn:'I go to work by car.'},
  {es:'el tiempo',en:'time / weather',pos:'noun',cat:'nouns',tip:'Context tells you: "el tiempo libre" = free time. "el tiempo" alone often = weather.',ex:'Â¿QuÃ© tiempo hace hoy?',exEn:'What\'s the weather like today?'},
  {es:'la comida',en:'food',pos:'noun',cat:'nouns',tip:'From "comer" (to eat) â€” spot the connection!',ex:'La comida mexicana es deliciosa.',exEn:'Mexican food is delicious.'},
  {es:'el agua',en:'water',pos:'noun',cat:'nouns',tip:'Feminine word but uses "el" to avoid double-a sound: "el agua frÃ­a".',ex:'Â¿Me trae un vaso de agua?',exEn:'Can you bring me a glass of water?'},
  {es:'el amigo / la amiga',en:'friend (m/f)',pos:'noun',cat:'nouns',tip:'Spanish changes word endings for gender â€” -o masculine, -a feminine.',ex:'Ella es mi mejor amiga.',exEn:'She is my best friend.'},
  {es:'la ciudad',en:'the city',pos:'noun',cat:'nouns',tip:'Words ending in -dad are feminine.',ex:'Me gusta vivir en esta ciudad.',exEn:'I like living in this city.'},
  {es:'el dinero',en:'money',pos:'noun',cat:'nouns',tip:'Uncountable in Spanish â€” always singular.',ex:'No tengo mucho dinero.',exEn:'I don\'t have much money.'},
  {es:'la tienda',en:'the store / shop',pos:'noun',cat:'nouns',tip:'"La tienda de ropa" = clothing store. "La tienda de comida" = grocery store.',ex:'Voy a la tienda a comprar leche.',exEn:'I\'m going to the store to buy milk.'},
  {es:'el restaurante',en:'the restaurant',pos:'noun',cat:'nouns',tip:'Almost the same as English â€” cognate words are your friends!',ex:'Â¿Vamos al restaurante esta noche?',exEn:'Shall we go to the restaurant tonight?'},
  {es:'el aviÃ³n',en:'the airplane',pos:'noun',cat:'nouns',tip:'Accent on the Ã³ â€” "ah-vee-OHN".',ex:'El aviÃ³n sale a las ocho.',exEn:'The plane leaves at eight.'},
  {es:'el mÃ©dico / la mÃ©dica',en:'doctor (m/f)',pos:'noun',cat:'nouns',tip:'Also "el doctor / la doctora".',ex:'Necesito ver al mÃ©dico.',exEn:'I need to see the doctor.'},

  // PHRASES
  {es:'Â¿cÃ³mo te llamas?',en:'What\'s your name?',pos:'phrase',cat:'phrases',tip:'Literally "what do you call yourself?" â€” very natural in Spanish.',ex:'Â¿CÃ³mo te llamas? Me llamo Tom.',exEn:'What\'s your name? My name is Tom.'},
  {es:'me llamoâ€¦',en:'My name isâ€¦',pos:'phrase',cat:'phrases',tip:'Literally "I call myselfâ€¦" â€” used more than "mi nombre es".',ex:'Me llamo Tom y soy de CanadÃ¡.',exEn:'My name is Tom and I\'m from Canada.'},
  {es:'Â¿de dÃ³nde eres?',en:'Where are you from?',pos:'phrase',cat:'phrases',tip:'"Â¿De dÃ³nde es usted?" is the formal version.',ex:'Â¿De dÃ³nde eres? Soy de CanadÃ¡.',exEn:'Where are you from? I\'m from Canada.'},
  {es:'no entiendo',en:'I don\'t understand',pos:'phrase',cat:'phrases',tip:'Essential phrase â€” never be afraid to say it!',ex:'Lo siento, no entiendo. Â¿Puedes repetir?',exEn:'Sorry, I don\'t understand. Can you repeat?'},
  {es:'Â¿puedes repetir?',en:'Can you repeat?',pos:'phrase',cat:'phrases',tip:'Pair with "mÃ¡s despacio" (more slowly) for full effect.',ex:'Â¿Puedes repetir mÃ¡s despacio, por favor?',exEn:'Can you repeat more slowly, please?'},
  {es:'mÃ¡s despacio',en:'more slowly',pos:'phrase',cat:'phrases',tip:'A lifesaver with fast native speakers!',ex:'Habla mÃ¡s despacio, por favor.',exEn:'Speak more slowly, please.'},
  {es:'me gusta',en:'I like',pos:'phrase',cat:'phrases',tip:'Literally "it pleases me" â€” the thing you like is the subject.',ex:'Me gusta mucho la mÃºsica latina.',exEn:'I really like Latin music.'},
  {es:'no me gusta',en:'I don\'t like',pos:'phrase',cat:'phrases',tip:'Use "no me gustan" when disliking multiple things.',ex:'No me gusta el frÃ­o.',exEn:'I don\'t like the cold.'},
  {es:'Â¿cuÃ¡nto cuesta?',en:'How much does it cost?',pos:'phrase',cat:'phrases',tip:'"Â¿CuÃ¡nto cuestan?" for multiple items.',ex:'Â¿CuÃ¡nto cuesta este libro?',exEn:'How much does this book cost?'},
  {es:'Â¿dÃ³nde estÃ¡â€¦?',en:'Where isâ€¦?',pos:'phrase',cat:'phrases',tip:'Essential for directions and finding things.',ex:'Â¿DÃ³nde estÃ¡ el baÃ±o, por favor?',exEn:'Where is the bathroom, please?'},
  {es:'tengo hambre',en:'I\'m hungry',pos:'phrase',cat:'phrases',tip:'Literally "I have hunger" â€” Spanish uses tener for feelings.',ex:'Tengo mucha hambre. Â¿Comemos?',exEn:'I\'m very hungry. Shall we eat?'},
  {es:'tengo sed',en:'I\'m thirsty',pos:'phrase',cat:'phrases',tip:'"Sed" = thirst. "Tengo + noun" is the pattern for many feelings.',ex:'Tengo sed, Â¿hay agua?',exEn:'I\'m thirsty, is there water?'},
  {es:'Â¿quÃ© hora es?',en:'What time is it?',pos:'phrase',cat:'phrases',tip:'"Son las tres" (it\'s three). "Es la una" (it\'s one).',ex:'Â¿QuÃ© hora es? Son las dos.',exEn:'What time is it? It\'s two o\'clock.'},
  {es:'no hablo bien espaÃ±ol',en:'I don\'t speak Spanish well',pos:'phrase',cat:'phrases',tip:'A humble opener â€” native speakers love the effort!',ex:'Disculpe, no hablo bien espaÃ±ol.',exEn:'Excuse me, I don\'t speak Spanish well.'},
  {es:'estoy aprendiendo espaÃ±ol',en:'I\'m learning Spanish',pos:'phrase',cat:'phrases',tip:'Great icebreaker â€” it explains everything and invites patience.',ex:'Estoy aprendiendo espaÃ±ol para hablar con mi familia.',exEn:'I\'m learning Spanish to talk with my family.'},
  {es:'Â¿hablas inglÃ©s?',en:'Do you speak English?',pos:'phrase',cat:'phrases',tip:'Useful backup â€” but try Spanish first!',ex:'Â¿Hablas inglÃ©s? Mi espaÃ±ol es bÃ¡sico.',exEn:'Do you speak English? My Spanish is basic.'},

  // NUMBERS
  {es:'cero',en:'0 â€” zero',pos:'number',cat:'numbers',tip:'Used in phone numbers, scores, and addresses.',ex:'Mi equipo perdiÃ³ cero a uno.',exEn:'My team lost zero to one.'},
  {es:'uno / una',en:'1 â€” one',pos:'number',cat:'numbers',tip:'"Uno" drops the -o before masculine nouns: "un libro" (one book).',ex:'Quiero un cafÃ©, por favor.',exEn:'I want one coffee, please.'},
  {es:'dos',en:'2 â€” two',pos:'number',cat:'numbers',tip:'Numbers 2â€“9 don\'t change for gender.',ex:'Tengo dos hermanos.',exEn:'I have two brothers.'},
  {es:'tres',en:'3 â€” three',pos:'number',cat:'numbers',tip:'Used in telling time: "son las tres" (it\'s three o\'clock).',ex:'Son las tres de la tarde.',exEn:'It\'s three in the afternoon.'},
  {es:'cuatro',en:'4 â€” four',pos:'number',cat:'numbers',tip:'4 wheels = cuatro ruedas.',ex:'Hay cuatro personas en mi familia.',exEn:'There are four people in my family.'},
  {es:'cinco',en:'5 â€” five',pos:'number',cat:'numbers',tip:'Think Cinco de Mayo â€” already in your memory!',ex:'El restaurante cierra a las cinco.',exEn:'The restaurant closes at five.'},
  {es:'seis',en:'6 â€” six',pos:'number',cat:'numbers',tip:'Pronounced "say-ees" â€” two syllables.',ex:'Tengo seis clases esta semana.',exEn:'I have six classes this week.'},
  {es:'siete',en:'7 â€” seven',pos:'number',cat:'numbers',tip:'Three syllables: "see-EH-teh".',ex:'Hay siete dÃ­as en la semana.',exEn:'There are seven days in the week.'},
  {es:'ocho',en:'8 â€” eight',pos:'number',cat:'numbers',tip:'Pretty intuitive to remember!',ex:'El tren llega a las ocho.',exEn:'The train arrives at eight.'},
  {es:'nueve',en:'9 â€” nine',pos:'number',cat:'numbers',tip:'Pronounced "NWEH-beh".',ex:'Tiene nueve vidas, como un gato.',exEn:'It has nine lives, like a cat.'},
  {es:'diez',en:'10 â€” ten',pos:'number',cat:'numbers',tip:'"Diez" is the root for 11â€“19: once, doce, treceâ€¦',ex:'Espera diez minutos, por favor.',exEn:'Wait ten minutes, please.'},
  {es:'once / doce / trece',en:'11 / 12 / 13',pos:'number',cat:'numbers',tip:'11â€“15 are unique words, not combinations.',ex:'Son las doce del mediodÃ­a.',exEn:'It\'s twelve noon.'},
  {es:'catorce / quince',en:'14 / 15',pos:'number',cat:'numbers',tip:'"Quince" is very common â€” quinceaÃ±era = 15th birthday!',ex:'Quince dÃ­as son dos semanas.',exEn:'Fifteen days are two weeks.'},
  {es:'diecisÃ©is â€¦ diecinueve',en:'16 â€” 19',pos:'number',cat:'numbers',tip:'"Dieci" + unit. 16=diecisÃ©is, 17=diecisiete, 18=dieciocho, 19=diecinueve.',ex:'Tengo diecisiete aÃ±os.',exEn:'I am seventeen years old.'},
  {es:'veinte',en:'20 â€” twenty',pos:'number',cat:'numbers',tip:'20s: veinti + unit. 21=veintiuno, 22=veintidÃ³sâ€¦',ex:'Cuesta veinte dÃ³lares.',exEn:'It costs twenty dollars.'},
  {es:'treinta',en:'30 â€” thirty',pos:'number',cat:'numbers',tip:'30+: treinta y + unit. The "y" means "and".',ex:'Hay treinta dÃ­as en septiembre.',exEn:'There are thirty days in September.'},
  {es:'cuarenta',en:'40 â€” forty',pos:'number',cat:'numbers',tip:'40â€“90 all end in -enta (except cincuenta).',ex:'Son cuarenta minutos en coche.',exEn:'It\'s forty minutes by car.'},
  {es:'cincuenta',en:'50 â€” fifty',pos:'number',cat:'numbers',tip:'Notice "cinco" hiding inside cincuenta!',ex:'Mi padre tiene cincuenta aÃ±os.',exEn:'My father is fifty years old.'},
  {es:'sesenta / setenta',en:'60 / 70',pos:'number',cat:'numbers',tip:'60=sesenta, 70=setenta â€” both end in -enta.',ex:'El vuelo dura sesenta minutos.',exEn:'The flight lasts sixty minutes.'},
  {es:'ochenta / noventa',en:'80 / 90',pos:'number',cat:'numbers',tip:'Spot ocho (8) and nueve (9) hiding inside!',ex:'Mi abuela tiene ochenta aÃ±os.',exEn:'My grandmother is eighty years old.'},
  {es:'cien / ciento',en:'100',pos:'number',cat:'numbers',tip:'"Cien" alone; "ciento" when combining: ciento uno = 101.',ex:'Hay cien personas en la fiesta.',exEn:'There are one hundred people at the party.'},

  // MONTHS
  {es:'enero',en:'January',pos:'month',cat:'months',tip:'Months are NOT capitalized in Spanish.',ex:'Mi cumpleaÃ±os es en enero.',exEn:'My birthday is in January.'},
  {es:'febrero',en:'February',pos:'month',cat:'months',tip:'Think "February" â€” febr- sounds similar.',ex:'San ValentÃ­n es el catorce de febrero.',exEn:'Valentine\'s Day is February 14th.'},
  {es:'marzo',en:'March',pos:'month',cat:'months',tip:'Sounds like "Mars" â€” the Roman god of March.',ex:'La primavera empieza en marzo.',exEn:'Spring begins in March.'},
  {es:'abril',en:'April',pos:'month',cat:'months',tip:'Very close to English "April".',ex:'En abril llueve mucho en Winnipeg.',exEn:'In April it rains a lot in Winnipeg.'},
  {es:'mayo',en:'May',pos:'month',cat:'months',tip:'You already know this â€” Â¡Cinco de Mayo!',ex:'Cinco de Mayo es en mayo.',exEn:'Cinco de Mayo is in May.'},
  {es:'junio',en:'June',pos:'month',cat:'months',tip:'Sounds like "June-io" â€” easy to remember.',ex:'Las vacaciones empiezan en junio.',exEn:'Holidays start in June.'},
  {es:'julio',en:'July',pos:'month',cat:'months',tip:'Named after Julius Caesar â€” Julio CÃ©sar in Spanish.',ex:'Hace mucho calor en julio.',exEn:'It\'s very hot in July.'},
  {es:'agosto',en:'August',pos:'month',cat:'months',tip:'Named after Augustus Caesar.',ex:'Voy de vacaciones en agosto.',exEn:'I\'m going on vacation in August.'},
  {es:'septiembre',en:'September',pos:'month',cat:'months',tip:'Sept = seven in Latin â€” it was once the 7th month.',ex:'Los niÃ±os vuelven al colegio en septiembre.',exEn:'Kids go back to school in September.'},
  {es:'octubre',en:'October',pos:'month',cat:'months',tip:'Oct = eight in Latin. Halloween is Halloween in Spanish too!',ex:'Las hojas cambian de color en octubre.',exEn:'The leaves change colour in October.'},
  {es:'noviembre',en:'November',pos:'month',cat:'months',tip:'Nov = nine in Latin. Notice the -iembre ending on Sep/Oct/Nov/Dec.',ex:'Hace frÃ­o en noviembre en CanadÃ¡.',exEn:'It\'s cold in November in Canada.'},
  {es:'diciembre',en:'December',pos:'month',cat:'months',tip:'Dec = ten in Latin. Navidad = Christmas!',ex:'La Navidad es en diciembre.',exEn:'Christmas is in December.'},

  // DAYS
  {es:'lunes',en:'Monday',pos:'day',cat:'days',tip:'Days are NOT capitalized in Spanish. From "luna" (moon).',ex:'El lunes empiezo mi dieta.',exEn:'On Monday I start my diet.'},
  {es:'martes',en:'Tuesday',pos:'day',cat:'days',tip:'From "Marte" (Mars).',ex:'Los martes tengo clase de espaÃ±ol.',exEn:'On Tuesdays I have Spanish class.'},
  {es:'miÃ©rcoles',en:'Wednesday',pos:'day',cat:'days',tip:'From "Mercurio" (Mercury). Note the accent!',ex:'El miÃ©rcoles voy al mÃ©dico.',exEn:'On Wednesday I\'m going to the doctor.'},
  {es:'jueves',en:'Thursday',pos:'day',cat:'days',tip:'From "JÃºpiter" (Jupiter).',ex:'Â¿QuÃ© haces el jueves?',exEn:'What are you doing on Thursday?'},
  {es:'viernes',en:'Friday',pos:'day',cat:'days',tip:'From "Venus". TGIF = Â¡Por fin es viernes!',ex:'El viernes salimos a cenar.',exEn:'On Friday we\'re going out for dinner.'},
  {es:'sÃ¡bado',en:'Saturday',pos:'day',cat:'days',tip:'From "Sabbath" â€” a day of rest.',ex:'El sÃ¡bado dormimos hasta tarde.',exEn:'On Saturday we sleep in late.'},
  {es:'domingo',en:'Sunday',pos:'day',cat:'days',tip:'From "Domingo" (the Lord\'s day).',ex:'El domingo comemos en familia.',exEn:'On Sunday we eat as a family.'},

  // COLORS
  {es:'rojo / roja',en:'red',pos:'color',cat:'colors',tip:'Adjectives match gender: un coche rojo (m), una manzana roja (f).',ex:'La bandera de EspaÃ±a es roja y amarilla.',exEn:'The flag of Spain is red and yellow.'},
  {es:'azul',en:'blue',pos:'color',cat:'colors',tip:'Same for m/f â€” only changes for plural: azules.',ex:'El cielo es azul.',exEn:'The sky is blue.'},
  {es:'verde',en:'green',pos:'color',cat:'colors',tip:'Same for m/f â€” verde, verde, verdes.',ex:'Me gustan las manzanas verdes.',exEn:'I like green apples.'},
  {es:'amarillo / amarilla',en:'yellow',pos:'color',cat:'colors',tip:'Changes for gender like rojo/roja.',ex:'El sol es amarillo.',exEn:'The sun is yellow.'},
  {es:'negro / negra',en:'black',pos:'color',cat:'colors',tip:'Common in clothing â€” "una camiseta negra" (a black t-shirt).',ex:'Tengo un gato negro.',exEn:'I have a black cat.'},
  {es:'blanco / blanca',en:'white',pos:'color',cat:'colors',tip:'"Blanca" is also a name â€” Blanca means "white" in Spanish.',ex:'La nieve es blanca.',exEn:'Snow is white.'},
  {es:'marrÃ³n',en:'brown',pos:'color',cat:'colors',tip:'Also "cafÃ©" in Latin America for brown.',ex:'Tengo los ojos marrones.',exEn:'I have brown eyes.'},
  {es:'gris',en:'grey',pos:'color',cat:'colors',tip:'Same for m/f. Plural: grises.',ex:'El cielo estÃ¡ gris hoy.',exEn:'The sky is grey today.'},

  // FAMILY
  {es:'la madre / mamÃ¡',en:'mother / mom',pos:'family',cat:'family',tip:'"MamÃ¡" is informal. "La madre" is formal.',ex:'Mi mamÃ¡ habla espaÃ±ol.',exEn:'My mom speaks Spanish.'},
  {es:'el padre / papÃ¡',en:'father / dad',pos:'family',cat:'family',tip:'"PapÃ¡" has an accent to distinguish from "papa" (potato)!',ex:'Mi papÃ¡ es muy gracioso.',exEn:'My dad is very funny.'},
  {es:'el hermano / la hermana',en:'brother / sister',pos:'family',cat:'family',tip:'"Los hermanos" = brothers OR siblings (mixed group).',ex:'Tengo un hermano y una hermana.',exEn:'I have a brother and a sister.'},
  {es:'el abuelo / la abuela',en:'grandfather / grandmother',pos:'family',cat:'family',tip:'"Los abuelos" = grandparents.',ex:'Mis abuelos viven en MÃ©xico.',exEn:'My grandparents live in Mexico.'},
  {es:'el suegro / la suegra',en:'father-in-law / mother-in-law',pos:'family',cat:'family',tip:'"Los suegros" = in-laws. Very useful for your situation!',ex:'Mis suegros hablan solo espaÃ±ol.',exEn:'My in-laws only speak Spanish.'},
  {es:'el cuÃ±ado / la cuÃ±ada',en:'brother-in-law / sister-in-law',pos:'family',cat:'family',tip:'"Los cuÃ±ados" = siblings-in-law.',ex:'Mi cuÃ±ado es muy simpÃ¡tico.',exEn:'My brother-in-law is very nice.'},
  {es:'el sobrino / la sobrina',en:'nephew / niece',pos:'family',cat:'family',tip:'From Latin "nepos" â€” related to "nephew" in English.',ex:'Mis sobrinos son muy divertidos.',exEn:'My nephews/nieces are very fun.'},
  {es:'el tÃ­o / la tÃ­a',en:'uncle / aunt',pos:'family',cat:'family',tip:'"Los tÃ­os" = aunt and uncle together.',ex:'Mi tÃ­a hace la mejor comida.',exEn:'My aunt makes the best food.'},
];

const CATS = ['all','greetings','verbs','nouns','phrases','numbers','months','days','colors','family'];
const CAT_LABELS = {all:'All',greetings:'Greetings',verbs:'Verbs',nouns:'Nouns',phrases:'Phrases',numbers:'Numbers',months:'Months',days:'Days',colors:'Colors',family:'Family'};

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AVATAR STATE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let mouthTimer, bobTimer, mouthFrame = 0;
const MOUTHS = [
  "M 58 87 Q 75 90 92 87",
  "M 56 86 Q 75 95 94 86",
  "M 54 84 Q 75 98 96 84",
  "M 55 86 Q 75 94 95 86",
];
const MOUTH_IDLE = "M 55 88 Q 75 93 95 88";

function setAvatar(state) {
  const glow = document.getElementById('glow');
  const lbl = document.getElementById('status-label');
  const bars = document.getElementById('sound-bars');
  const think = document.getElementById('think-bubbles');
  const svg = document.getElementById('carlos-svg');
  const mouth = document.getElementById('mouth');
  clearInterval(mouthTimer); clearInterval(bobTimer);
  if (!glow || !lbl || !bars || !think || !svg || !mouth) return;
  bars.setAttribute('opacity','0'); think.setAttribute('opacity','0');
  svg.style.transform = 'translateY(0)';
  mouth.setAttribute('d', MOUTH_IDLE);

  const colors = {speaking:'#e8b86d', listening:'#c0392b', thinking:'#8e44ad', idle:'#27ae60'};
  const labels = {speaking:'Speaking', listening:'Listening', thinking:'Thinking…', idle:'Online'};
  glow.setAttribute('stroke', colors[state] || colors.idle);
  glow.setAttribute('opacity', state === 'idle' ? '0' : '0.55');
  lbl.textContent = labels[state] || 'Carlos';
  lbl.style.color = colors[state] || colors.idle;

  if (state === 'speaking') {
    mouthTimer = setInterval(() => {
      mouthFrame = (mouthFrame + 1) % 4;
      document.getElementById('mouth')?.setAttribute('d', MOUTHS[mouthFrame]);
    }, 110);
    let t = 0; bobTimer = setInterval(() => { t += 0.15; svg.style.transform = `translateY(${Math.sin(t)*2}px)`; }, 30);
  }
  if (state === 'listening') {
    bars.setAttribute('opacity','1');
    let t = 0; bobTimer = setInterval(() => { t += 0.1; svg.style.transform = `translateY(${Math.sin(t)*1.5}px)`; }, 30);
  }
  if (state === 'thinking') think.setAttribute('opacity','1');
}

// Blink
(function blink() {
  const eyeIds = ['iris-l','iris-r','pupil-l','pupil-r','shine-l','shine-r'];
  const origRy = {['iris-l']:8,['iris-r']:8,['pupil-l']:4,['pupil-r']:4,['shine-l']:2,['shine-r']:2};
  function doBlink() {
    eyeIds.forEach(id => { const el = document.getElementById(id); if(el) el.setAttribute('ry','1'); });
    setTimeout(() => eyeIds.forEach(id => { const el = document.getElementById(id); if(el) el.setAttribute('ry', origRy[id] || '7'); }), 120);
    setTimeout(doBlink, 2000 + Math.random()*3000);
  }
  setTimeout(doBlink, 1800);
})();

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// VOICE
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
function getBestVoice() {
  const voices = window.speechSynthesis.getVoices();
  const prefs = [
    v => v.lang==='es-ES' && v.name.includes('Google'),
    v => v.lang==='es-MX' && v.name.includes('Google'),
    v => v.lang.startsWith('es') && v.name.includes('Google'),
    v => v.lang==='es-ES', v => v.lang.startsWith('es'),
  ];
  for (const p of prefs) { const f = voices.find(p); if(f) return f; }
  return null;
}
let isSpeaking = false;
function speakText(text, onDone) {
  window.speechSynthesis.cancel();
  const clean = text.replace(/\*/g,'').replace(/[¡¿]/g,'').trim();
  const utter = new SpeechSynthesisUtterance(clean);
  const v = getBestVoice(); if(v){utter.voice=v;utter.lang=v.lang;}else{utter.lang='es-ES';}
  utter.rate = 0.82; utter.pitch = 1.1;
  utter.onstart = () => { isSpeaking=true; setAvatar('speaking'); const stopBtn = document.getElementById('stop-btn'); if (stopBtn) stopBtn.style.display='block'; };
  utter.onend = utter.onerror = () => { isSpeaking=false; setAvatar('idle'); const stopBtn = document.getElementById('stop-btn'); if (stopBtn) stopBtn.style.display='none'; if(onDone) onDone(); };
  window.speechSynthesis.speak(utter);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// CHAT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let apiHistory = loadCarlosHistory(), isLoading = false, autoSpeak = true, level = state.user?.level || 'A1 Beginner';

function fmtText(text) {
  return escapeCarlosText(text).replace(/\*([^*]+)\*/g,'<strong class="es">$1</strong>').replace(/\n/g,'<br>');
}
function formatCarlosTimestamp(createdAt) {
  const timestamp = Number(createdAt || Date.now());
  const elapsed = Math.max(0, Date.now() - timestamp);
  if (elapsed < 60_000) return 'Just now';
  if (elapsed < 3_600_000) return `${Math.max(1, Math.floor(elapsed / 60_000))} min ago`;
  const date = new Date(timestamp);
  const time = new Intl.DateTimeFormat([], {hour:'numeric',minute:'2-digit'}).format(date);
  return date.toDateString() === new Date().toDateString() ? `Today • ${time}` : time;
}
function addBubble(role, text, createdAt = Date.now()) {
  const msgs = document.getElementById('messages');
  if (!msgs) return;
  const isUser = role === 'user';
  const d = document.createElement('article');
  d.className = `bub ${isUser ? 'user' : 'ai'}`;
  const time = formatCarlosTimestamp(createdAt);
  d.innerHTML = isUser
    ? `<div class="bub-body"><div class="bub-copy">${fmtText(text)}</div><time>${time} <span aria-hidden="true">✓✓</span></time></div>`
    : `<img class="bub-avatar" src="${getCarlosAsset('speaking')}" alt="Carlos" onerror="${CARLOS_FALLBACK_ONERROR}"><div class="bub-body"><div class="bub-copy">${fmtText(text)}</div><time>${time}</time></div>`;
  msgs.appendChild(d);
  requestAnimationFrame(() => d.scrollIntoView({behavior:'smooth',block:'end'}));
}
function showTyping() {
  const msgs = document.getElementById('messages');
  if (!msgs) return;
  const d = document.createElement('article'); d.id='typing-bub'; d.className='bub ai';
  d.innerHTML=`<img class="bub-avatar" src="${getCarlosAsset('thinking')}" alt="" onerror="${CARLOS_FALLBACK_ONERROR}"><div class="bub-body"><div class="typing" aria-label="Carlos is thinking"><span>Carlos is thinking</span><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>`;
  msgs.appendChild(d); d.scrollIntoView({behavior:'smooth',block:'end'});
}
async function sendMessage(text) {
  if(!text || isLoading) return;
  isLoading=true; window.speechSynthesis.cancel();
  document.getElementById('carlos-suggestions')?.setAttribute('hidden','');
  const stopBtn = document.getElementById('stop-btn');
  if (stopBtn) stopBtn.style.display='none';
  const startsNewConversation = !apiHistory.some(entry => entry.role === 'user');
  addBubble('user',text);
  if (startsNewConversation) recordCarlosConversationStart();
  apiHistory.push({role:'user',content:text,createdAt:Date.now()});
  saveCarlosHistory();
  setAvatar('thinking'); showTyping();
  try {
    const data = await requestCarlosReply();
    document.getElementById('typing-bub')?.remove();
    if(data.error) throw new Error(data.error);
    apiHistory.push({role:'assistant',content:data.reply,createdAt:Date.now()});
    saveCarlosHistory();
    addBubble('ai',data.reply);
    if(autoSpeak) speakText(data.reply); else setAvatar('idle');
  } catch(e) {
    document.getElementById('typing-bub')?.remove();
    const fallbackReply = getOfflineCarlosReply(text);
    apiHistory.push({role:'assistant',content:fallbackReply,createdAt:Date.now()});
    saveCarlosHistory();
    addBubble('ai',fallbackReply);
    if(autoSpeak) speakText(fallbackReply); else setAvatar('idle');
  } finally { isLoading=false; }
}

function recordCarlosConversationStart() {
  const key = 'habla_activity_stats_v1';
  let activity = {};
  try { activity = JSON.parse(localStorage.getItem(key) || '{}'); } catch {}
  activity.carlosConversationsCount = Number(activity.carlosConversationsCount || 0) + 1;
  activity.lastCarlosConversationAt = new Date().toISOString();
  localStorage.setItem(key, JSON.stringify(activity));
}

async function requestCarlosReply() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const res = await fetch('/chat', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({messages:apiHistory,level,context:getCarlosConversationContext()}),
      signal:controller.signal
    });
    if (!res.ok) throw new Error(`Carlos service returned ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timeout);
  }
}

function getCarlosConversationContext() {
  const lesson = getCurrentLesson();
  return {
    learnerName: state.user?.name || '',
    level: state.user?.level || level,
    learningGoal: state.user?.learningGoal || state.user?.goal || '',
    dialect: state.user?.dialect || state.user?.preferredDialect || '',
    lesson: lesson ? {id:lesson.id || '',title:lesson.title || ''} : null
  };
}

function getOfflineCarlosReply(text) {
  const message = text.toLocaleLowerCase();
  const lessonTitle = String(getCurrentLesson()?.title || 'today’s lesson').replace(/^[^:]+:\s*/, '');
  if (/let's practice|practice today/.test(message)) return `¡Perfecto! We’ll practice *${lessonTitle}* together. I’ll keep it simple and help when you need it. *¿Empezamos?*`;
  if (/review something|review recent/.test(message)) return '¡Claro! Let’s review one useful pattern first: *Quiero + infinitive* means “I want to…” Can you make a sentence with it?';
  if (/simple a1|free conversation/.test(message)) return '¡Perfecto! Let’s have a simple conversation. *¿Cómo estás hoy?* You can answer: “Estoy bien,” “Estoy cansado,” or “Estoy feliz.”';
  if (/oat milk|leche de avena/.test(message)) return 'Puedes decir:\n*Con leche de avena, por favor.*\nThat means “With oat milk, please.”';
  if (/coffee|café|cafe/.test(message)) return '¡Claro! Puedes decir:\n*Quisiera un café, por favor.*\nThat means “I would like a coffee, please.” What would you like to add to it?';
  if (/thank|gracias|another example/.test(message)) return '¡Por supuesto!\n*Me gustaría practicar otro ejemplo.*\nThat means “I would like to practice another example.” Can you repeat it in Spanish?';
  if (/hola|hello|buenos días|buenas tardes|buenas noches/.test(message)) return '¡Hola! Me alegra hablar contigo. *¿Cómo estás hoy?*';
  if (/my name is|me llamo|introduc/.test(message)) return '¡Mucho gusto! Try this pattern: *Me llamo… y soy de…* What city are you from?';
  return '¡Buena pregunta! My full AI conversation service is not connected yet, but we can still practice a simple A1 exchange. Try asking me about greetings, introductions, or ordering coffee.';
}

function loadCarlosHistory() {
  try {
    const saved = JSON.parse(localStorage.getItem(CARLOS_HISTORY_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(entry => entry && ['user','assistant'].includes(entry.role) && typeof entry.content === 'string').slice(-40) : [];
  } catch (error) {
    return [];
  }
}

function saveCarlosHistory() {
  try {
    localStorage.setItem(CARLOS_HISTORY_KEY, JSON.stringify(apiHistory.slice(-40)));
  } catch (error) {}
}

function escapeCarlosText(text) {
  return String(text)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#39;');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// MIC / SPEECH RECOGNITION
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let recognition=null, isListening=false;
function startListening() {
  const errEl = document.getElementById('mic-err');
  const txt = document.getElementById('txt');
  const micBtn = document.getElementById('mic-btn');
  if (!errEl || !txt || !micBtn) return;
  errEl.style.display='none';
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SR){errEl.textContent='Speech recognition is not supported here. You can still type to Carlos.';errEl.style.display='block';return;}
  window.speechSynthesis.cancel();
  recognition = new SR();
  recognition.lang='es-ES'; recognition.continuous=false; recognition.interimResults=true;
  let final='';
  recognition.onstart=()=>{isListening=true;micBtn.classList.add('on');txt.placeholder='Listening… speak now';setAvatar('listening');};
  recognition.onresult=(e)=>{
    let interim=''; final='';
    for(const r of e.results){if(r.isFinal)final+=r[0].transcript;else interim+=r[0].transcript;}
    const currentTxt = document.getElementById('txt');
    if (currentTxt) currentTxt.value=final||interim;
  };
  recognition.onerror=(e)=>{
    stopListening();
    const msgs={['not-allowed']:'Microphone blocked — allow it in your browser settings.',['network']:'Microphone connection error — try typing instead.',};
    errEl.textContent=msgs[e.error]||`Mic error: ${e.error}. Try typing instead.`;
    errEl.style.display='block';
  };
  recognition.onend=()=>{
    stopListening();
    const currentTxt = document.getElementById('txt');
    const t=final||currentTxt?.value.trim();
    if(t&&currentTxt){currentTxt.value='';updateSendBtn();sendMessage(t);}
  };
  try{recognition.start();}catch(e){stopListening();errEl.textContent='Could not start mic: '+e.message;errEl.style.display='block';}
}
function stopListening(){
  isListening=false;
  document.getElementById('mic-btn')?.classList.remove('on');
  const txt = document.getElementById('txt');
  if (txt) txt.placeholder=txt.dataset.idlePlaceholder || 'Ask Carlos anything in Spanish...';
  try{recognition?.stop();}catch(e){}
  if(!isSpeaking) setAvatar('idle');
}
function updateSendBtn(){
  const sendBtn = document.getElementById('snd-btn');
  const txt = document.getElementById('txt');
  if (!sendBtn || !txt) return;
  sendBtn.classList.toggle('ok',txt.value.trim().length>0);
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// VOCAB RENDER
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let currentCat='all', pronouncing=null;
function renderVocab(cat){
  currentCat=cat;
  document.querySelectorAll('.cat-btn').forEach(b=>b.classList.toggle('active',b.dataset.cat===cat));
  const data=cat==='all'?VOCAB:VOCAB.filter(v=>v.cat===cat);
  document.getElementById('vgrid').innerHTML=data.map((v,i)=>`
    <div class="vcard">
      <div class="v-left">
        <div class="v-es">${v.es}</div>
        <div class="v-en">${v.en}</div>
        <div class="v-tip">${v.tip}</div>
        <div class="ex-row">
          <div style="flex:1"><div class="v-ex">${v.ex}</div><div class="v-ex-en">${v.exEn}</div></div>
          <button class="pbtn" id="ex-pbtn-${i}" onclick="pronounceEx('${v.ex.replace(/'/g,"\\'")}',${i},'ex')" title="Hear example">ðŸ”Š</button>
        </div>
      </div>
      <div class="v-right">
        <button class="pbtn" id="w-pbtn-${i}" onclick="pronounceEx('${v.es.replace(/'/g,"\\'")}',${i},'w')" title="Hear word">ðŸ”Š</button>
        <div class="v-pos">${v.pos}</div>
      </div>
    </div>`).join('');
}
function pronounceEx(text, idx, type) {
  const btnId = `${type==='ex'?'ex-':'w-'}pbtn-${idx}`;
  const btn = document.getElementById(btnId);
  if(!btn) return;
  if(window.speechSynthesis.speaking){window.speechSynthesis.cancel();document.querySelectorAll('.pbtn.speaking').forEach(b=>b.classList.remove('speaking'));if(pronouncing===btnId){pronouncing=null;return;}}
  btn.classList.add('speaking'); pronouncing=btnId;
  const utter=new SpeechSynthesisUtterance(text.replace(/[Â¡Â¿]/g,''));
  const v=getBestVoice();if(v){utter.voice=v;utter.lang=v.lang;}else{utter.lang='es-ES';}
  utter.rate=0.82;utter.pitch=1.1;
  utter.onend=utter.onerror=()=>{btn.classList.remove('speaking');pronouncing=null;};
  window.speechSynthesis.speak(utter);
}

function buildCats(){
  const el=document.getElementById('cat-btns');
  el.innerHTML=CATS.map(c=>`<button class="cat-btn${c==='all'?' active':''}" data-cat="${c}" onclick="renderVocab('${c}')">${CAT_LABELS[c]}</button>`).join('');
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// QUIZ
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let quizWords=[], quizIdx=0, quizScore=0, quizAnswered=false, quizCat='all', currentQuizWord=null;

function startQuiz(cat){
  quizCat=cat;
  const pool=(cat==='all'?VOCAB:VOCAB.filter(v=>v.cat===cat));
  if(pool.length<4){alert('Not enough words in this category yet!');return;}
  quizWords=shuffle([...pool]).slice(0,Math.min(10,pool.length));
  quizIdx=0;quizScore=0;
  document.getElementById('quiz-area').style.display='block';
  document.getElementById('q-result').style.display='none';
  document.querySelectorAll('.quiz-hero')[0].style.display='none';
  showQuestion();
}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
function showQuestion(){
  if(quizIdx>=quizWords.length){showResult();return;}
  quizAnswered=false;
  const word=quizWords[quizIdx]; currentQuizWord=word;
  document.getElementById('q-cat').textContent=CAT_LABELS[word.cat]||word.cat;
  document.getElementById('q-word').textContent=word.es;
  document.getElementById('q-hint').textContent=word.tip;
  document.getElementById('q-feedback').textContent='';
  document.getElementById('q-feedback').className='q-feedback';
  document.getElementById('q-next').style.display='none';
  const pct=Math.round((quizIdx/quizWords.length)*100);
  document.getElementById('q-bar').style.width=pct+'%';
  document.getElementById('q-count').textContent=`${quizIdx+1}/${quizWords.length}`;
  document.getElementById('q-score-disp').textContent=`â­ ${quizScore}`;
  // Build options
  const pool=VOCAB.filter(v=>v.cat===word.cat&&v.es!==word.es);
  const distractors=shuffle(pool).slice(0,3).map(v=>v.en);
  const options=shuffle([word.en,...distractors]);
  document.getElementById('q-options').innerHTML=options.map(opt=>`<button class="q-opt" onclick="checkAnswer(this,'${opt.replace(/'/g,"\\'")}','${word.en.replace(/'/g,"\\'")}')">${opt}</button>`).join('');
}
function checkAnswer(btn,chosen,correct){
  if(quizAnswered)return;
  quizAnswered=true;
  const fb=document.getElementById('q-feedback');
  const opts=document.querySelectorAll('.q-opt');
  opts.forEach(b=>{
    if(b.textContent.trim()===correct)b.classList.add(chosen===correct?'correct':'reveal');
    if(b===btn&&chosen!==correct)b.classList.add('wrong');
    b.disabled=true;
  });
  if(chosen===correct){quizScore++;fb.textContent='Â¡Correcto! âœ“';fb.className='q-feedback ok';}
  else{fb.textContent=`Not quite â€” the answer is: ${correct}`;fb.className='q-feedback bad';}
  document.getElementById('q-score-disp').textContent=`â­ ${quizScore}`;
  document.getElementById('q-next').style.display='block';
  pronounceQuizWord();
}
function pronounceQuizWord(){
  if(!currentQuizWord)return;
  const utter=new SpeechSynthesisUtterance(currentQuizWord.es.replace(/[Â¡Â¿]/g,''));
  const v=getBestVoice();if(v){utter.voice=v;utter.lang=v.lang;}else{utter.lang='es-ES';}
  utter.rate=0.8;window.speechSynthesis.speak(utter);
}
function nextQuestion(){quizIdx++;showQuestion();}
function showResult(){
  document.getElementById('q-bar').style.width='100%';
  document.getElementById('quiz-area').style.display='none';
  const pct=Math.round((quizScore/quizWords.length)*100);
  const res=document.getElementById('q-result');
  res.style.display='block';
  const trophies=['ðŸ˜”','ðŸ™‚','ðŸ‘','ðŸŽ‰','ðŸ†'];
  document.getElementById('q-trophy').textContent=trophies[Math.floor(pct/25)]||'ðŸ†';
  document.getElementById('q-result-title').textContent=pct>=80?'Â¡Excelente!':pct>=60?'Â¡Muy bien!':pct>=40?'Â¡Buen intento!':'Â¡Sigue practicando!';
  document.getElementById('q-final-score').textContent=`${quizScore} / ${quizWords.length}`;
  const msgs=['Keep practicing â€” every word counts!','Good effort! Review the ones you missed.','Nice work! You\'re building a solid foundation.','Impressive! You really know your Spanish!','Â¡Perfecto! You\'re a Spanish superstar!'];
  document.getElementById('q-result-msg').textContent=msgs[Math.floor(pct/25)]||msgs[4];
}
function resetQuiz(){
  document.getElementById('q-result').style.display='none';
  document.getElementById('quiz-area').style.display='none';
  document.querySelectorAll('.quiz-hero')[0].style.display='block';
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// EVENTS & INIT
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
let currentPage = "home";

initializeProgressEngine(state, {
  onProgressChange() {
    saveState(state);
    updateLevelButton();

    if (currentPage === "home" || currentPage === "profile") {
      renderAppPage(currentPage);
    }
  },
});

contentReady
  .then(() => {
    if (currentPage === "home" || currentPage === "learn" || currentPage === "journey" || currentPage === "carlos" || currentPage === "practice") {
      renderAppPage(currentPage);
    }
  })
  .catch(error => console.error("Habla content could not be loaded:", error));

updateLevelButton();
saveState(state);

function renderAppPage(page) {
  currentPage = page;
  document.body.classList.toggle('carlos-mode', page === 'carlos');
  renderPage(page);
  if (page === 'journey' || page === 'lesson') {
    const dashboard = document.getElementById('dashboard');
    if (dashboard) dashboard.scrollTop = 0;
  }
  const navMount = document.getElementById('bottom-nav');
  if (navMount) navMount.innerHTML = renderNavigation(page === 'journey' || page === 'lesson' ? 'learn' : page);

  if (page === 'carlos') {
    initializeCarlosUI();
  }
}

function updateLevelButton() {
  const levelBtn = document.getElementById('level-btn');
  const levelLabel = document.getElementById('header-level-label');
  const levelCode = document.getElementById('header-level-code');
  const avatar = document.getElementById('header-avatar');
  const journey = getHeaderJourney(getCurrentXP());

  if (levelLabel) levelLabel.textContent = journey.name;
  if (levelCode) levelCode.textContent = journey.code;
  if (levelBtn) levelBtn.setAttribute('aria-label', `View your Spanish journey. Current level: ${journey.name}, ${journey.code} ${journey.cefrLabel}.`);
  setText('level-journey-title', journey.name);
  setText('level-journey-cefr', `${journey.code} ${journey.cefrLabel}`);
  setText('level-journey-xp', journey.isComplete ? `${formatNumber(journey.xp)} XP` : `${formatNumber(journey.xp)} / ${formatNumber(journey.nextXP)} XP`);
  setText('level-journey-percent', `${journey.percent}%`);
  setText('level-journey-next', journey.nextName);
  setText('level-journey-remaining', journey.isComplete ? 'Journey level complete' : `${formatNumber(journey.remaining)} XP remaining`);
  const progressBar = document.getElementById('level-journey-progress');
  if (progressBar) progressBar.style.width = `${journey.percent}%`;
  if (avatar) avatar.textContent = getHeaderInitials(state.user.name);
}

function getHeaderJourney(xpValue) {
  const levels = [
    { code: 'A1', name: 'Explorer', cefrLabel: 'Beginner', minXP: 0, nextXP: 500 },
    { code: 'A2', name: 'Traveler', cefrLabel: 'Elementary', minXP: 500, nextXP: 1500 },
    { code: 'B1', name: 'Local', cefrLabel: 'Intermediate', minXP: 1500, nextXP: 3500 },
    { code: 'B2', name: 'Adventurer', cefrLabel: 'Upper Intermediate', minXP: 3500, nextXP: 7000 },
    { code: 'C1', name: 'Insider', cefrLabel: 'Advanced', minXP: 7000, nextXP: 12000 },
    { code: 'C2', name: 'Fluent', cefrLabel: 'Proficient', minXP: 12000, nextXP: 12000 },
  ];
  const xp = Math.max(0, Number(xpValue || 0));
  const index = levels.reduce((current, level, levelIndex) => xp >= level.minXP ? levelIndex : current, 0);
  const level = levels[index];
  const nextLevel = levels[index + 1];
  const range = Math.max(1, level.nextXP - level.minXP);
  const percent = nextLevel ? Math.min(100, Math.round(((xp - level.minXP) / range) * 100)) : 100;

  return {
    ...level,
    xp,
    percent,
    isComplete: !nextLevel,
    nextName: nextLevel?.name || 'Fluent',
    remaining: nextLevel ? Math.max(0, level.nextXP - xp) : 0,
  };
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (element) element.textContent = value;
}

function formatNumber(value) {
  return new Intl.NumberFormat('en-CA').format(Number(value || 0));
}

function getHeaderInitials(name) {
  return String(name || 'H').trim().split(/\s+/).slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('') || 'H';
}

function initializeCarlosUI() {
  const txt = document.getElementById('txt');
  const sendBtn = document.getElementById('snd-btn');
  const micBtn = document.getElementById('mic-btn');
  const stopBtn = document.getElementById('stop-btn');
  const autoToggle = document.getElementById('auto-toggle');
  const messages = document.getElementById('messages');
  const suggestions = document.getElementById('carlos-suggestions');
  const menuButton = document.querySelector('[data-carlos-menu]');
  const quickMenu = document.getElementById('carlos-quick-menu');

  if (!txt || !sendBtn || !micBtn || !stopBtn || !autoToggle || !messages) return;

  messages.innerHTML = '';
  const intro = getCarlosIntro();

  if (apiHistory.length === 1 && apiHistory[0].role === 'assistant') {
    apiHistory[0].content = intro;
    saveCarlosHistory();
  }

  if (apiHistory.length === 0) {
    apiHistory.push({role:'assistant',content:intro,createdAt:Date.now()});
    saveCarlosHistory();
    addBubble('ai',intro);
    setTimeout(()=>{if(autoSpeak && document.getElementById('messages'))speakText(intro);},900);
  } else {
    apiHistory.forEach(entry => addBubble(entry.role, entry.content, entry.createdAt));
  }

  const dueRecap = consumeDueRecap();
  if (dueRecap) {
    const recapEntry = {
      role: 'assistant',
      content: `*A little message from Carlos*\n${dueRecap.message}`,
      createdAt: new Date(dueRecap.deliverAt).getTime(),
      memoryRecapId: dueRecap.id,
    };
    apiHistory.push(recapEntry);
    apiHistory = apiHistory.slice(-40);
    saveCarlosHistory();
    addBubble('ai', recapEntry.content, recapEntry.createdAt);
  }

  if (apiHistory.some(entry => entry.role === 'user')) suggestions?.setAttribute('hidden','');
  else suggestions?.removeAttribute('hidden');
  const voiceState = document.getElementById('carlos-voice-state');
  if (voiceState) voiceState.textContent = autoSpeak ? 'On' : 'Off';

  txt.addEventListener('input',updateSendBtn);
  txt.addEventListener('keydown',e=>{if(e.key==='Enter'){const t=e.target.value.trim();if(t){e.target.value='';updateSendBtn();sendMessage(t);}}});
  sendBtn.addEventListener('click',()=>{const t=txt.value.trim();if(t){txt.value='';updateSendBtn();sendMessage(t);}});
  micBtn.addEventListener('click',()=>{if(isListening)stopListening();else startListening();});
  stopBtn.addEventListener('click',()=>{window.speechSynthesis.cancel();isSpeaking=false;setAvatar('idle');stopBtn.style.display='none';});
  autoToggle.addEventListener('click',toggleAutoSpeak);
  autoToggle.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleAutoSpeak();}});
  document.querySelectorAll('[data-carlos-prompt]').forEach(button => {
    button.addEventListener('click', () => {
      txt.value = button.dataset.carlosPrompt || '';
      updateSendBtn();
      txt.focus();
    });
  });
  document.querySelectorAll('[data-carlos-send-prompt]').forEach(button => {
    button.addEventListener('click', () => sendMessage(button.dataset.carlosSendPrompt || ''));
  });
  menuButton?.addEventListener('click', () => {
    const willOpen = quickMenu?.hasAttribute('hidden');
    quickMenu?.toggleAttribute('hidden', !willOpen);
    menuButton.setAttribute('aria-expanded', String(Boolean(willOpen)));
  });
  document.querySelector('[data-carlos-voice-toggle]')?.addEventListener('click', () => {
    toggleAutoSpeak();
    const voiceState = document.getElementById('carlos-voice-state');
    if (voiceState) voiceState.textContent = autoSpeak ? 'On' : 'Off';
  });
  document.querySelector('[data-carlos-reset]')?.addEventListener('click', () => {
    window.speechSynthesis.cancel();
    apiHistory = [{role:'assistant',content:intro,createdAt:Date.now()}];
    saveCarlosHistory();
    messages.innerHTML = '';
    addBubble('ai', intro);
    suggestions?.removeAttribute('hidden');
    quickMenu?.setAttribute('hidden','');
    menuButton?.setAttribute('aria-expanded','false');
    setAvatar('idle');
  });

  updateSendBtn();
  setAvatar('idle');
}

function getCarlosIntro() {
  const name = String(state.user?.name || 'amigo').split(' ')[0];
  const lesson = getCurrentLesson();
  const lessonTitle = String(lesson?.title || "today's lesson").replace(/^[^:]+:\s*/, '');
  const lessonNumber = Number(lesson?.lesson || lesson?.number || lesson?.id?.match?.(/\d+/)?.[0] || 1);
  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';
  const timeOfDay = hour < 12 ? 'Good morning!' : hour < 18 ? 'Good afternoon!' : 'Good evening!';

  return `*¡${greeting}, ${name}!* 👋\n${timeOfDay}\n\nI remember you’re working on Lesson ${lessonNumber}: *${lessonTitle}*. We can practice it together, review recent words, or just chat over a coffee.\n\nWhat sounds fun?`;
}

function toggleAutoSpeak() {
  autoSpeak=!autoSpeak;
  const track = document.getElementById('tog-track');
  const knob = document.getElementById('tog-k');
  if (track) track.style.background=autoSpeak?'var(--green)':'var(--border)';
  if (knob) knob.style.left=autoSpeak?'14px':'2px';
  if(!autoSpeak){window.speechSynthesis.cancel();setAvatar('idle');}
}

document.addEventListener('click', (event) => {
  const missionTarget = event.target.closest('[data-mission-complete]');
  if (missionTarget) {
    completeDailyMission(missionTarget.dataset.missionComplete);
    renderAppPage('home');
    return;
  }

  const pageTarget = event.target.closest('[data-page]');
  if (!pageTarget) return;
  if (pageTarget.dataset.lessonId) {
    setActiveLesson(pageTarget.dataset.lessonId);
  }
  if (pageTarget.dataset.practiceLibrary) {
    localStorage.removeItem(PRACTICE_TOPIC_KEY);
    let practiceSession = {};
    try { practiceSession = JSON.parse(sessionStorage.getItem(PRACTICE_SESSION_KEY) || '{}'); } catch {}
    practiceSession.view = 'library';
    delete practiceSession.libraryCategoryId;
    delete practiceSession.libraryCollectionId;
    delete practiceSession.libraryItemId;
    delete practiceSession.returnView;
    sessionStorage.setItem(PRACTICE_SESSION_KEY, JSON.stringify(practiceSession));
  } else if (pageTarget.dataset.practiceTopic) {
    localStorage.setItem(PRACTICE_TOPIC_KEY, pageTarget.dataset.practiceTopic);
    let practiceSession = {};
    try { practiceSession = JSON.parse(sessionStorage.getItem(PRACTICE_SESSION_KEY) || '{}'); } catch {}
    practiceSession.topic = pageTarget.dataset.practiceTopic;
    practiceSession.view = 'launcher';
    sessionStorage.setItem(PRACTICE_SESSION_KEY, JSON.stringify(practiceSession));
  } else if (pageTarget.dataset.page === 'practice') {
    localStorage.removeItem(PRACTICE_TOPIC_KEY);
    sessionStorage.removeItem(PRACTICE_SESSION_KEY);
  }
  renderAppPage(pageTarget.dataset.page);
});

window.addEventListener('habla:practice-render', () => {
  if (currentPage === 'practice') renderAppPage('practice');
});

window.addEventListener('habla:lesson-render', (event) => {
  if (currentPage !== 'lesson') return;
  const previousScrollTop = document.getElementById('dashboard')?.scrollTop || 0;
  renderAppPage('lesson');
  if (event.detail?.scroll) {
    document.getElementById('dashboard')?.scrollTo({ top: 0, behavior: 'smooth' });
    document.getElementById('lesson-stage')?.focus({ preventScroll: true });
  } else {
    const dashboard = document.getElementById('dashboard');
    if (dashboard) dashboard.scrollTop = previousScrollTop;
  }
});

window.addEventListener('habla:lesson-completed', (event) => {
  const lesson = event.detail?.lesson;
  if (!lesson) return;
  rememberLessonCompletion(lesson);
  scheduleLessonRecap(lesson);
});

window.addEventListener('habla:practice-conversation', (event) => {
  renderAppPage('carlos');
  const input = document.getElementById('txt');
  if (input) {
    input.value = `Let's practice a short ${event.detail?.title || 'Spanish'} conversation.`;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.focus();
  }
});

document.getElementById('level-btn').addEventListener('click',()=>{
  const overlay = document.getElementById('level-overlay');
  const shouldOpen = !overlay.classList.contains('open');
  overlay.classList.toggle('open', shouldOpen);
  overlay.setAttribute('aria-hidden', String(!shouldOpen));
  document.getElementById('level-btn').setAttribute('aria-expanded', String(shouldOpen));
});
document.getElementById('level-overlay').addEventListener('click',e=>{
  if(e.target===document.getElementById('level-overlay')){
    document.getElementById('level-overlay').classList.remove('open');
    document.getElementById('level-overlay').setAttribute('aria-hidden','true');
    document.getElementById('level-btn').setAttribute('aria-expanded','false');
  }
});
document.getElementById('level-view-journey').addEventListener('click',()=>{
  document.getElementById('level-overlay').classList.remove('open');
  document.getElementById('level-overlay').setAttribute('aria-hidden','true');
  document.getElementById('level-btn').setAttribute('aria-expanded','false');
});
document.addEventListener('keydown',event=>{
  if(event.key !== 'Escape' || !document.getElementById('level-overlay').classList.contains('open')) return;
  document.getElementById('level-overlay').classList.remove('open');
  document.getElementById('level-overlay').setAttribute('aria-hidden','true');
  document.getElementById('level-btn').setAttribute('aria-expanded','false');
  document.getElementById('level-btn').focus();
});

renderAppPage('home');

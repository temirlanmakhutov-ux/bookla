// Fills the local database with fictional demo businesses (same as the prototype).
// Run: npm run db:seed   (reads DEMO_* values from .env)
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { addDays, localToUtc, todayLocal } from "../src/lib/time";

const prisma = new PrismaClient();

type Svc = [tr: string, en: string, ru: string, min: number, price: number];
type Biz = {
  slug: string; cat: string; name: string; city: string; area: string; rating: number; rc: number;
  hours: [number, number]; off: number[]; langs: string; staff: string[]; color: string; s: Svc[];
  capacity?: number; step?: number;
};

const BIZ: Biz[] = [
  { slug: "limon-kuafor", cat: "hair", name: "Limon Kuaför", city: "girne", area: "Karaoğlanoğlu", rating: 4.9, rc: 212, hours: [9, 20], off: [0], langs: "TR,EN,RU", staff: ["Elif", "Merve", "Olga"], color: "#D9A21B",
    s: [["Kadın saç kesimi", "Women’s haircut", "Женская стрижка", 60, 900], ["Fön", "Blow-dry", "Укладка", 45, 500], ["Saç boyama", "Hair colouring", "Окрашивание", 120, 2400], ["Keratin bakımı", "Keratin treatment", "Кератиновое выпрямление", 150, 3500]] },
  { slug: "harbour-barber", cat: "barber", name: "Harbour Barber Co.", city: "girne", area: "Merkez", rating: 4.8, rc: 341, hours: [10, 21], off: [], langs: "TR,EN", staff: ["Mehmet", "Can"], color: "#2F4858",
    s: [["Saç kesimi", "Haircut", "Стрижка", 30, 450], ["Sakal", "Beard trim", "Оформление бороды", 20, 250], ["Saç + sakal", "Haircut + beard", "Стрижка + борода", 50, 650], ["Çocuk saç kesimi", "Kids haircut", "Детская стрижка", 30, 350]] },
  { slug: "nar-nail", cat: "nails", name: "Nar Nail Studio", city: "girne", area: "Alsancak", rating: 4.9, rc: 158, hours: [10, 19], off: [0], langs: "TR,EN,RU", staff: ["Seda", "Irina"], color: "#C8553D",
    s: [["Manikür", "Manicure", "Маникюр", 60, 700], ["Kalıcı oje", "Gel polish", "Покрытие гель-лаком", 75, 950], ["Pedikür", "Pedicure", "Педикюр", 75, 1000], ["Protez tırnak", "Nail extensions", "Наращивание ногтей", 120, 1600]] },
  { slug: "anna-brows", cat: "beauty", name: "Brow Bar by Anna", city: "iskele", area: "Long Beach", rating: 5.0, rc: 74, hours: [10, 19], off: [0], langs: "RU,EN,TR", staff: ["Anna"], color: "#B5838D",
    s: [["Kaş tasarımı", "Brow shaping", "Коррекция бровей", 45, 600], ["Kaş laminasyonu", "Brow lamination", "Ламинирование бровей", 60, 1200], ["Kirpik lifting", "Lash lift", "Ламинирование ресниц", 60, 1300], ["İpek kirpik", "Lash extensions", "Наращивание ресниц", 120, 1800]] },
  { slug: "zeytin-spa", cat: "massage", name: "Zeytin Spa & Masaj", city: "girne", area: "Lapta", rating: 4.7, rc: 96, hours: [10, 22], off: [], langs: "TR,EN,RU", staff: ["Aylin", "Nika"], color: "#6B8F71",
    s: [["Klasik masaj · 60 dk", "Classic massage · 60 min", "Классический массаж · 60 мин", 60, 1800], ["Aromaterapi masajı", "Aromatherapy massage", "Аромамассаж", 60, 2000], ["Hamam + köpük", "Hammam & foam", "Хаммам с пенным массажем", 45, 1500], ["Çift masajı", "Couples massage", "Массаж для двоих", 60, 3400]] },
  { slug: "beyaz-dis", cat: "dentist", name: "Beyaz Diş Kliniği", city: "lefkosa", area: "Dereboyu", rating: 4.8, rc: 203, hours: [9, 18], off: [0, 6], langs: "TR,EN", staff: ["Dt. Kemal", "Dt. Zeynep"], color: "#3E7CB1",
    s: [["Muayene", "Check-up", "Осмотр", 20, 800], ["Diş taşı temizliği", "Scale & polish", "Профессиональная чистка", 45, 2000], ["Dolgu", "Filling", "Пломба", 60, 2500], ["Diş beyazlatma", "Teeth whitening", "Отбеливание", 90, 6000]] },
  { slug: "aile-saglik", cat: "doctor", name: "Aile Sağlık Merkezi", city: "lefkosa", area: "Köşklüçiftlik", rating: 4.6, rc: 131, hours: [9, 17], off: [0], langs: "TR,EN,RU", staff: ["Dr. Ahmet", "Dr. Selin"], color: "#2A9D8F",
    s: [["Dahiliye muayenesi", "GP consultation", "Приём терапевта", 20, 1500], ["Çocuk doktoru", "Paediatrician", "Приём педиатра", 20, 1500], ["Kan tahlili", "Blood test", "Анализ крови", 15, 900], ["Check-up paketi", "Full check-up", "Комплексный чек-ап", 60, 4500]] },
  { slug: "patili-vet", cat: "vet", name: "Patili Veteriner", city: "magusa", area: "Sakarya", rating: 4.9, rc: 88, hours: [9, 19], off: [], langs: "TR,EN", staff: ["Vet. Hakan"], color: "#D08C60",
    s: [["Muayene", "Check-up", "Осмотр", 30, 900], ["Aşı", "Vaccination", "Прививка", 20, 1100], ["Pet kuaför", "Pet grooming", "Груминг", 90, 1500]] },
  { slug: "parlak-oto", cat: "car", name: "Parlak Oto Yıkama", city: "lefkosa", area: "Gönyeli", rating: 4.5, rc: 176, hours: [8, 19], off: [], langs: "TR,EN", staff: [], color: "#4A6FA5", capacity: 2,
    s: [["Dış yıkama", "Exterior wash", "Мойка кузова", 30, 400], ["İç + dış yıkama", "Full wash", "Комплексная мойка", 60, 800], ["Detaylı temizlik", "Detailing", "Детейлинг", 180, 3500], ["Yağ değişimi", "Oil change", "Замена масла", 45, 1200]] },
  { slug: "mavi-rent", cat: "rent", name: "Mavi Rent a Car", city: "girne", area: "Merkez", rating: 4.7, rc: 264, hours: [8, 20], off: [], langs: "TR,EN,RU", staff: [], color: "#1E88A8", capacity: 4, step: 60,
    s: [["Ekonomi araç · 1 gün", "Economy car · 1 day", "Эконом · сутки", 30, 1400], ["SUV · 1 gün", "SUV · 1 day", "Внедорожник · сутки", 30, 2600], ["Ekonomi · 7 gün", "Economy · 7 days", "Эконом · 7 суток", 30, 8400], ["Havalimanı teslim", "Airport delivery", "Доставка в аэропорт", 30, 900]] },
  { slug: "liman-balik", cat: "food", name: "Liman Balık Restoran", city: "girne", area: "Antik Liman", rating: 4.6, rc: 512, hours: [12, 23], off: [], langs: "TR,EN,RU", staff: [], color: "#14506E", capacity: 6,
    s: [["Masa · 2 kişi", "Table for 2", "Столик на двоих", 120, 0], ["Masa · 4 kişi", "Table for 4", "Столик на четверых", 120, 0], ["Deniz kenarı masa", "Sea-front table", "Столик у самой воды", 120, 0], ["Doğum günü masası", "Birthday table", "Столик на день рождения", 150, 0]] },
  { slug: "karpaz-tekne", cat: "tours", name: "Karpaz Tekne Turları", city: "iskele", area: "Boğaz Limanı", rating: 4.8, rc: 143, hours: [9, 18], off: [], langs: "TR,EN,RU", staff: [], color: "#0B7A75", capacity: 3, step: 60,
    s: [["Tekne turu · 4 saat", "Boat trip · 4 h", "Морская прогулка · 4 ч", 240, 1800], ["Gün batımı turu", "Sunset cruise", "Закат на яхте", 120, 1500], ["Karpaz jeep safari", "Karpaz jeep safari", "Джип-сафари по Карпасу", 360, 2200], ["Özel yat kiralama", "Private yacht", "Яхта целиком", 240, 15000]] },
  { slug: "deniz-dalis", cat: "tours", name: "Deniz Dalış Merkezi", city: "girne", area: "Alsancak", rating: 4.9, rc: 201, hours: [8, 17], off: [], langs: "TR,EN,RU", staff: ["Kaan", "Mike"], color: "#145DA0", step: 60,
    s: [["Deneme dalışı", "Discover scuba", "Пробное погружение", 180, 2500], ["Şnorkel turu", "Snorkelling trip", "Снорклинг", 120, 1200], ["PADI Open Water", "PADI Open Water", "Курс PADI Open Water", 240, 14000]] },
  { slug: "salt-yoga", cat: "sport", name: "Salt Yoga Studio", city: "girne", area: "Esentepe", rating: 4.9, rc: 67, hours: [7, 21], off: [], langs: "EN,RU,TR", staff: ["Laura", "Darya"], color: "#8A9A5B",
    s: [["Hatha yoga", "Hatha yoga", "Хатха-йога", 60, 450], ["Pilates", "Pilates", "Пилатес", 55, 500], ["Özel ders", "Private session", "Индивидуальное занятие", 60, 1400], ["Gün doğumu yogası", "Sunrise beach yoga", "Йога на рассвете у моря", 60, 500]] },
  { slug: "form-gym", cat: "sport", name: "Form Gym", city: "magusa", area: "Salamis Yolu", rating: 4.5, rc: 119, hours: [6, 23], off: [], langs: "TR,EN", staff: ["Burak", "Deniz"], color: "#3D405B",
    s: [["Günlük giriş", "Day pass", "Разовое посещение", 90, 300], ["Kişisel antrenman", "Personal training", "Персональная тренировка", 60, 1000], ["Boks dersi", "Boxing class", "Бокс", 60, 500]] },
  { slug: "lingua-ders", cat: "edu", name: "Lingua Özel Ders", city: "magusa", area: "Karakol", rating: 4.8, rc: 54, hours: [10, 21], off: [], langs: "TR,EN,RU", staff: ["Ece", "Tom", "Maria"], color: "#7A5C9E",
    s: [["İngilizce", "English lesson", "Английский язык", 60, 700], ["Türkçe", "Turkish lesson", "Турецкий язык", 60, 700], ["Matematik", "Maths", "Математика", 60, 800], ["IELTS hazırlık", "IELTS prep", "Подготовка к IELTS", 90, 1200]] },
  { slug: "isik-foto", cat: "photo", name: "Işık Fotoğraf", city: "iskele", area: "Long Beach", rating: 4.9, rc: 39, hours: [7, 20], off: [], langs: "TR,EN,RU", staff: ["Deniz"], color: "#C08552",
    s: [["Mini çekim · 30 dk", "Mini shoot · 30 min", "Мини-фотосессия · 30 мин", 30, 2000], ["Aile çekimi", "Family shoot", "Семейная фотосессия", 60, 3500], ["Love story", "Love story", "Love story", 90, 4500]] },
  { slug: "temiz-ev", cat: "home", name: "Temiz Ev Hizmetleri", city: "girne", area: "Çatalköy", rating: 4.6, rc: 92, hours: [8, 18], off: [0], langs: "TR,EN,RU", staff: [], color: "#5C8D89", capacity: 2,
    s: [["Ev temizliği · 1+1", "Cleaning · 1-bed", "Уборка квартиры 1+1", 180, 1800], ["Ev temizliği · 2+1", "Cleaning · 2-bed", "Уборка квартиры 2+1", 240, 2400], ["Klima bakımı", "AC service", "Чистка кондиционера", 60, 900], ["Tesisatçı", "Plumber", "Сантехник", 60, 1000]] },
  { slug: "gul-kuafor", cat: "hair", name: "Gül Kuaför", city: "lefkosa", area: "Ortaköy", rating: 4.7, rc: 180, hours: [9, 19], off: [0], langs: "TR,EN", staff: ["Gül", "Ayşe"], color: "#C2606A",
    s: [["Kadın saç kesimi", "Women’s haircut", "Женская стрижка", 45, 700], ["Fön", "Blow-dry", "Укладка", 40, 400], ["Gelin saçı", "Bridal hair", "Свадебная причёска", 120, 4000]] },
];

async function main() {
  const password = process.env.DEMO_PASSWORD;
  const ownerEmail = process.env.DEMO_OWNER_EMAIL ?? "demo@bookla.local";
  const adminEmail = process.env.DEMO_ADMIN_EMAIL ?? "admin@bookla.local";
  if (!password || password.length < 8) throw new Error("Set DEMO_PASSWORD (8+ chars) in .env");

  await prisma.notification.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.business.deleteMany();
  await prisma.session.deleteMany();
  await prisma.owner.deleteMany();

  const passwordHash = await bcrypt.hash(password, 10);
  const owner = await prisma.owner.create({ data: { email: ownerEmail, name: "Demo", passwordHash, lang: "ru" } });
  await prisma.owner.create({ data: { email: adminEmail, name: "Admin", passwordHash, lang: "ru" } });

  const trialEndsAt = new Date(Date.now() + 30 * 86_400_000);
  let i = 0;
  for (const b of BIZ) {
    i++;
    await prisma.business.create({
      data: {
        slug: b.slug, name: b.name, category: b.cat, city: b.city, area: b.area,
        phone: `9000000000${String(i).padStart(2, "0")}`, // fictional, not a real number
        languages: b.langs, color: b.color, rating: b.rating, ratingCount: b.rc,
        capacity: b.capacity ?? 1, slotStep: b.step ?? 30, trialEndsAt,
        ownerId: b.slug === "limon-kuafor" ? owner.id : null,
        hours: { create: [0, 1, 2, 3, 4, 5, 6].filter((d) => !b.off.includes(d)).map((weekday) => ({ weekday, openMin: b.hours[0] * 60, closeMin: b.hours[1] * 60 })) },
        staff: { create: b.staff.map((name, sort) => ({ name, sort })) },
        services: { create: b.s.map(([nameTr, nameEn, nameRu, durationMin, price], sort) => ({ nameTr, nameEn, nameRu, durationMin, price, sort })) },
      },
    });
  }

  // a few bookings for the demo owner's salon so the dashboard isn't empty
  const limon = await prisma.business.findUniqueOrThrow({ where: { slug: "limon-kuafor" }, include: { staff: true, services: { orderBy: { sort: "asc" } } } });
  const st = Object.fromEntries(limon.staff.map((s) => [s.name, s.id]));
  const today = todayLocal();
  const demo: [string, number, string, number, string, string][] = [
    [today, 9 * 60 + 30, "Elif", 0, "Ayşe K.", "905000000101"],
    [today, 11 * 60, "Merve", 2, "Sarah W.", "905000000102"],
    [today, 13 * 60, "Olga", 1, "Наталья", "905000000103"],
    [today, 15 * 60 + 30, "Elif", 3, "Deniz Y.", "905000000104"],
    [today, 18 * 60, "Merve", 0, "Emma R.", "905000000105"],
    [addDays(today, 1), 10 * 60, "Olga", 0, "Мария", "905000000106"],
    [addDays(today, 1), 12 * 60, "Elif", 2, "Zeynep A.", "905000000107"],
  ];
  for (const [date, start, staff, si, name, phone] of demo) {
    const svc = limon.services[si];
    await prisma.booking.create({
      data: {
        token: randomBytes(18).toString("base64url"), businessId: limon.id, serviceId: svc.id, staffId: st[staff],
        date, startMin: start, endMin: start + svc.durationMin, startsAt: localToUtc(date, start),
        customerName: name, customerPhone: phone, price: svc.price, lang: name.match(/[а-я]/i) ? "ru" : "tr", source: "online",
      },
    });
  }
  console.log(`Seeded ${BIZ.length} businesses. Demo owner: ${ownerEmail}, admin: ${adminEmail} (password = DEMO_PASSWORD in .env)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

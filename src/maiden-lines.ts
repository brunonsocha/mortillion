// What Liora says, and when. Polish and Ukrainian lines address the player
// as "soul" (duszo / душе) and avoid gendered past tenses, so every line fits
// every player.

import type { L10n } from './data/types.ts';

export type MaidenEvent =
  | 'greet'
  | 'greetBack'
  | 'idle'
  | 'rare'
  | 'lord'
  | 'deaths'
  | 'resultLow'
  | 'resultMid'
  | 'resultHigh'
  | 'resultVictory'
  | 'endless'
  | 'abyss'
  | 'paywall';

export const MAIDEN_NAME: L10n = { en: 'Liora, the Ember Maiden', pl: 'Liora, Panna Żaru', uk: 'Ліора, Діва Жару' };

export const LINES: Record<MaidenEvent, L10n[]> = {
  greet: [
    { en: 'Welcome, pilgrim. I am Liora, keeper of this flame. Rest a while… then descend.', pl: 'Witaj, duszo. Jestem Liora, strażniczka tego płomienia. Odpocznij chwilę… a potem zejdź w dół.', uk: 'Вітаю, душе. Я — Ліора, хранителька цього полум’я. Відпочинь трохи… а тоді спускайся.' },
    { en: 'The fire burns low tonight. Bring me rare answers, and it will burn bright.', pl: 'Ogień przygasa tej nocy. Przynieś mi rzadkie odpowiedzi, a znów rozbłyśnie.', uk: 'Вогонь цієї ночі ледь жевріє. Принеси мені рідкісні відповіді — і він знову спалахне.' },
    { en: 'Ah… a soul by my fire. Mind the depths. They remember every mistake.', pl: 'Ach… dusza przy moim ognisku. Uważaj na głębiny. Pamiętają każdy błąd.', uk: 'Ах… душа біля мого вогнища. Стережися глибин. Вони пам’ятають кожну помилку.' },
  ],
  greetBack: [
    { en: 'Back so soon? The Daily Descent will wait for you until tomorrow.', pl: 'Już z powrotem? Codzienne Zejście zaczeka do jutra.', uk: 'Уже повертаєшся? Щоденний Спуск зачекає до завтра.' },
    { en: 'Your descent today was… memorable. Rest. The embers are yours.', pl: 'Dzisiejsze zejście było… niezapomniane. Odpocznij. Żar jest twój.', uk: 'Сьогоднішній спуск був… незабутнім. Відпочинь. Жар — твій.' },
  ],
  idle: [
    { en: 'Hm? You needn’t stare, pilgrim… though I don’t mind.', pl: 'Hm? Nie musisz się tak wpatrywać, duszo… choć wcale mi to nie przeszkadza.', uk: 'Гм? Не треба так пильно дивитися, душе… хоча я не проти.' },
    { en: 'They say the rarest answers lie just past the obvious ones. Look there.', pl: 'Mówią, że najrzadsze odpowiedzi kryją się tuż za oczywistymi. Szukaj tam.', uk: 'Кажуть, найрідкісніші відповіді ховаються одразу за очевидними. Шукай там.' },
    { en: 'I have tended this flame for a thousand descents. Yours are my favourite.', pl: 'Strzegę tego płomienia od tysiąca zejść. Twoje lubię najbardziej.', uk: 'Я бережу це полум’я вже тисячу спусків. Твої мені подобаються найбільше.' },
    { en: 'Do you hear bells below? Neither do I. It is very quiet down there.', pl: 'Słyszysz dzwony tam w dole? Ja też nie. Tam na dole jest bardzo cicho.', uk: 'Чуєш дзвони там, унизу? Я теж ні. Там дуже тихо.' },
    { en: 'Praise the… no. I won’t say it. Ask the knight.', pl: 'Chwała… nie. Nie powiem tego. Zapytaj rycerza.', uk: 'Слава… ні. Не скажу. Спитай лицаря.' },
    { en: 'The obvious answer is a warm bed. The rare one is a fire. Choose the fire.', pl: 'Oczywista odpowiedź to ciepłe łóżko. Rzadka to ogień. Wybierz ogień.', uk: 'Очевидна відповідь — тепле ліжко. Рідкісна — вогонь. Обери вогонь.' },
  ],
  rare: [
    { en: 'One in a mortillion…! I felt that one in my very soul.', pl: 'Jedna na mortylion…! Poczułam to w samej duszy.', uk: 'Одна на мортильйон…! Я відчула це самою душею.' },
    { en: 'Oh… how rare. How beautiful. Say it again, slowly.', pl: 'Och… jakie rzadkie. Jakie piękne. Powiedz to jeszcze raz, powoli.', uk: 'Ох… яка рідкість. Яка краса. Скажи це ще раз, повільно.' },
    { en: 'The flame leapt! Do you see what you do to me?', pl: 'Płomień aż podskoczył! Widzisz, co ze mną robisz?', uk: 'Полум’я аж підскочило! Бачиш, що ти зі мною робиш?' },
    { en: 'Not even the Duke’s archives hold an answer that deep. Remarkable.', pl: 'Nawet archiwa Księcia nie skrywają tak głębokiej odpowiedzi. Niezwykłe.', uk: 'Навіть архіви Герцога не знають такої глибокої відповіді. Неймовірно.' },
  ],
  lord: [
    { en: 'An answer worthy of a Lord of Cinder. I’m… impressed.', pl: 'Odpowiedź godna Władcy Żaru. Jestem… pod wrażeniem.', uk: 'Відповідь, гідна Володаря Жару. Я… вражена.' },
    { en: 'Few would think of that. There is something about you.', pl: 'Niewielu by na to wpadło. Jest w tobie coś szczególnego.', uk: 'Мало хто про таке подумав би. У тобі є щось особливе.' },
    { en: 'Deep. Very deep. Keep going.', pl: 'Głęboko. Bardzo głęboko. Schodź dalej.', uk: 'Глибоко. Дуже глибоко. Спускайся далі.' },
  ],
  deaths: [
    { en: 'Again? Get up. I didn’t light this fire for nothing.', pl: 'Znowu? Wstawaj. Nie rozpaliłam tego ognia na darmo.', uk: 'Знову? Вставай. Я не даремно розпалила цей вогонь.' },
    { en: 'Death is only a lesson… though you learn slowly, don’t you?', pl: 'Śmierć to tylko lekcja… choć uczysz się powoli, prawda?', uk: 'Смерть — лише урок… хоча вчишся ти повільно, правда?' },
    { en: 'Don’t you dare go Hollow on me.', pl: 'Nie waż mi się stać Pustym.', uk: 'Не смій стати Порожнім при мені.' },
  ],
  resultLow: [
    { en: 'Shallow, this time. The depths are patient… and so am I.', pl: 'Tym razem płytko. Głębiny są cierpliwe… ja też.', uk: 'Цього разу мілко. Глибини терплячі… і я теж.' },
    { en: 'Even the brightest flame begins as a spark. Come back to me tomorrow.', pl: 'Nawet najjaśniejszy płomień zaczyna się od iskry. Wróć do mnie jutro.', uk: 'Навіть найяскравіше полум’я починається з іскри. Повертайся до мене завтра.' },
  ],
  resultMid: [
    { en: 'A respectable descent. I’ll admit… I watched every step.', pl: 'Godne zejście. Przyznam… śledziłam każdy krok.', uk: 'Гідний спуск. Зізнаюся… я стежила за кожним кроком.' },
    { en: 'Not bad at all. The abyss noticed you today.', pl: 'Wcale nieźle. Otchłań cię dziś zauważyła.', uk: 'Зовсім непогано. Безодня тебе сьогодні помітила.' },
  ],
  resultHigh: [
    { en: 'So deep… you have me worried, and a little breathless.', pl: 'Tak głęboko… martwię się o ciebie. I brak mi tchu.', uk: 'Так глибоко… я хвилююся за тебе. І мені бракує подиху.' },
    { en: 'The flame burns hotter for you. Don’t let it go to your head.', pl: 'Płomień płonie dla ciebie goręcej. Tylko niech ci to nie uderzy do głowy.', uk: 'Полум’я горить для тебе гарячіше. Лише не загордися.' },
  ],
  resultVictory: [
    { en: 'Victory… I have waited ages for a soul like yours.', pl: 'Zwycięstwo… Czekałam wieki na taką duszę jak twoja.', uk: 'Перемога… я віками чекала на таку душу, як твоя.' },
    { en: 'One in a mortillion. Stay by my fire a while longer, would you?', pl: 'Jedna na mortylion. Zostań przy moim ogniu jeszcze chwilę, dobrze?', uk: 'Одна на мортильйон. Побудь біля мого вогню ще трохи, добре?' },
  ],
  endless: [
    { en: 'Three flasks, filled by my own hand. Don’t waste them.', pl: 'Trzy flakony, napełnione moją ręką. Nie zmarnuj ich.', uk: 'Три фляги, наповнені моєю рукою. Не змарнуй їх.' },
  ],
  abyss: [
    { en: 'You’re in the Abyss now. I can barely see your light…', pl: 'Jesteś już w Otchłani. Ledwie widzę twoje światło…', uk: 'Ти вже в Безодні. Я ледве бачу твоє світло…' },
  ],
  paywall: [
    { en: 'The embers are spent for now. Join the Covenant… and I’ll keep the fire burning just for you.', pl: 'Żar na razie się wypalił. Dołącz do Przymierza… a będę podtrzymywać ogień tylko dla ciebie.', uk: 'Жар поки що вигорів. Приєднуйся до Ковенанту… і я підтримуватиму вогонь лише для тебе.' },
  ],
};

/** Which result line fits a final score (points, not metres). */
export function resultEvent(points: number): MaidenEvent {
  if (points >= 600) return 'resultVictory';
  if (points >= 400) return 'resultHigh';
  if (points >= 150) return 'resultMid';
  return 'resultLow';
}

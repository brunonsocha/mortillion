// What Liora says, and when. She's warm and flirtatious (teasing, never
// explicit). Polish and Ukrainian lines address the player as "soul"
// (duszo / душе) and avoid gendered forms, so every line fits every player.

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
  | 'final'
  | 'paywall';

export const MAIDEN_NAME: L10n = { en: 'Liora, the Ember Maiden', pl: 'Liora, Panna Żaru', uk: 'Ліора, Діва Жару' };

export const LINES: Record<MaidenEvent, L10n[]> = {
  greet: [
    { en: 'Welcome back to my fire, pilgrim. I kept it warm… just for you.', pl: 'Witaj z powrotem przy moim ogniu, duszo. Grzałam go… tylko dla ciebie.', uk: 'Вітаю знову біля мого вогню, душе. Я гріла його… лише для тебе.' },
    { en: 'Ah, there you are. I was beginning to think you’d found another bonfire to sit by.', pl: 'Ach, jesteś. Już myślałam, że wolisz siadać przy innym ognisku.', uk: 'Ах, ось і ти. Я вже думала, що тобі затишніше біля іншого вогнища.' },
    { en: 'Come, sit closer. The night is cold, and I don’t bite… often.', pl: 'Chodź, usiądź bliżej. Noc jest zimna, a ja nie gryzę… zwykle.', uk: 'Ходи, сідай ближче. Ніч холодна, а я не кусаюся… зазвичай.' },
    { en: 'Today’s road is long. Walk it well, and I’ll be waiting at the end.', pl: 'Dzisiejsza droga jest długa. Przejdź ją dobrze, a będę czekać na jej końcu.', uk: 'Сьогоднішня дорога довга. Пройди її гідно — і я чекатиму на її кінці.' },
  ],
  greetBack: [
    { en: 'Today’s journey was… unforgettable. Stay a little longer?', pl: 'Dzisiejsza podróż była… niezapomniana. Zostaniesz jeszcze chwilę?', uk: 'Сьогоднішня мандрівка була… незабутньою. Побудеш ще трохи?' },
    { en: 'Back already? You can’t stay away from me, can you?', pl: 'Już z powrotem? Nie możesz beze mnie wytrzymać, prawda?', uk: 'Уже повертаєшся? Не можеш без мене, правда?' },
    { en: 'You’ve walked enough for one day. Rest here. Rest with me.', pl: 'Dość wędrówki na dziś. Odpocznij tutaj. Ze mną.', uk: 'Досить мандрів на сьогодні. Відпочинь тут. Зі мною.' },
  ],
  idle: [
    { en: 'Careful. Stare at a maiden that long and she starts getting ideas.', pl: 'Ostrożnie. Gdy tak długo patrzysz na pannę, zaczyna sobie coś wyobrażać.', uk: 'Обережно. Коли так довго дивишся на діву, вона починає щось собі уявляти.' },
    { en: 'Mm? If you wanted my attention, you only had to ask.', pl: 'Mm? Jeśli chcesz mojej uwagi, wystarczy poprosić.', uk: 'М-м? Якщо хочеш моєї уваги, достатньо попросити.' },
    { en: 'They say the rarest answers hide just past the obvious. Much like me.', pl: 'Mówią, że najrzadsze odpowiedzi kryją się tuż za oczywistymi. Zupełnie jak ja.', uk: 'Кажуть, найрідкісніші відповіді ховаються одразу за очевидними. Зовсім як я.' },
    { en: 'A thousand pilgrims have sat by this fire. None of them looked at me quite like you do.', pl: 'Tysiąc pielgrzymów siedziało przy tym ogniu. Żaden nie patrzył na mnie tak jak ty.', uk: 'Тисяча прочан сиділа біля цього вогню. Жоден не дивився на мене так, як ти.' },
    { en: 'Praise the… no. I’m saving my praise for you.', pl: 'Chwała… nie. Moją chwałę zachowam dla ciebie.', uk: 'Слава… ні. Свою славу я бережу для тебе.' },
    { en: 'The fire is warm, but beside you it gets warmer. Don’t tell the fire.', pl: 'Ogień grzeje, ale przy tobie robi mi się goręcej. Nie mów mu.', uk: 'Вогонь гріє, але поруч із тобою мені гарячіше. Не кажи йому.' },
    { en: 'Go on, then. Impress me.', pl: 'No dalej. Zaimponuj mi.', uk: 'Ну ж бо. Вразь мене.' },
  ],
  rare: [
    { en: 'One in a mortillion…! Do that again. I want to feel it.', pl: 'Jedna na mortylion…! Zrób to jeszcze raz. Chcę to poczuć.', uk: 'Одна на мортильйон…! Зроби це ще раз. Хочу це відчути.' },
    { en: 'Oh… now that was something. My heart is still racing.', pl: 'Och… to było coś. Serce wciąż mi wali.', uk: 'Ох… оце було щось. Серце досі калатає.' },
    { en: 'How rare. How beautiful. You are going to spoil me.', pl: 'Jakie rzadkie. Jakie piękne. Rozpieszczasz mnie.', uk: 'Яка рідкість. Яка краса. Ти мене розбестиш.' },
    { en: 'The flame leapt, and so did I. Behave yourself.', pl: 'Płomień podskoczył, i ja też. Zachowuj się.', uk: 'Полум’я підскочило — і я теж. Поводься пристойно.' },
  ],
  lord: [
    { en: 'Ooh. Clever and charming. A dangerous combination.', pl: 'Och. Bystrość i urok. Niebezpieczne połączenie.', uk: 'Ох. Кмітливість і чарівність. Небезпечне поєднання.' },
    { en: 'Few would think of that. I like the way your mind works.', pl: 'Niewielu by na to wpadło. Podoba mi się, jak myślisz.', uk: 'Мало хто про таке подумав би. Мені подобається, як ти мислиш.' },
    { en: 'Keep answering like that and I’ll follow you anywhere.', pl: 'Odpowiadaj tak dalej, a pójdę za tobą wszędzie.', uk: 'Відповідай так і далі — і я піду за тобою куди завгодно.' },
  ],
  deaths: [
    { en: 'Again? Get up. I didn’t light this fire to watch you lie in the dirt.', pl: 'Znowu? Wstawaj. Nie po to rozpaliłam ten ogień, by patrzeć, jak leżysz w błocie.', uk: 'Знову? Вставай. Я не для того розпалила вогонь, щоб дивитися, як ти лежиш у багнюці.' },
    { en: 'Twice now. Shall I come and pick you up myself?', pl: 'To już drugi raz. Mam po ciebie przyjść i cię podnieść?', uk: 'Це вже вдруге. Мені прийти й підняти тебе?' },
    { en: 'Don’t you dare go Hollow on me. I’d miss that face.', pl: 'Nie waż mi się stać Pustym. Tęskniłabym za tą twarzą.', uk: 'Не смій стати Порожнім при мені. Я сумуватиму за цим обличчям.' },
  ],
  resultLow: [
    { en: 'Not your best walk. Come back tomorrow. I’ll be here; I always am.', pl: 'Nie najlepszy spacer. Wróć jutro. Będę tu, zawsze jestem.', uk: 'Не найкраща прогулянка. Повертайся завтра. Я буду тут — я завжди тут.' },
    { en: 'A short journey, hm? Don’t worry. Distance isn’t everything… today.', pl: 'Krótka podróż, hm? Nie martw się. Dystans to nie wszystko… przynajmniej dziś.', uk: 'Коротка мандрівка, гм? Не хвилюйся. Відстань — це не все… принаймні сьогодні.' },
  ],
  resultMid: [
    { en: 'A respectable journey. I’ll admit… I watched every step.', pl: 'Godna podróż. Przyznam… śledziłam każdy krok.', uk: 'Гідна мандрівка. Зізнаюся… я стежила за кожним кроком.' },
    { en: 'Not bad at all. Keep this up and I might start blushing.', pl: 'Wcale nieźle. Tak dalej, a zacznę się rumienić.', uk: 'Зовсім непогано. Так і далі — і я почну червоніти.' },
  ],
  resultHigh: [
    { en: 'So far… you have me worried, and a little breathless.', pl: 'Tak daleko… martwię się o ciebie. I brak mi tchu.', uk: 'Так далеко… я хвилююся за тебе. І мені бракує подиху.' },
    { en: 'The flame burns hotter for you. So do I. Don’t let it go to your head.', pl: 'Płomień płonie dla ciebie goręcej. Ja też. Tylko niech ci to nie uderzy do głowy.', uk: 'Полум’я горить для тебе гарячіше. І я теж. Лише не загордися.' },
  ],
  resultVictory: [
    { en: 'Victory… I’ve waited ages for a soul like yours. Stay by my fire tonight?', pl: 'Zwycięstwo… Czekałam wieki na taką duszę. Zostaniesz dziś przy moim ogniu?', uk: 'Перемога… я віками чекала на таку душу. Залишишся сьогодні біля мого вогню?' },
    { en: 'One in a mortillion. Sit with me a while. I won’t let you go so easily.', pl: 'Jedna na mortylion. Posiedź ze mną. Tak łatwo cię nie wypuszczę.', uk: 'Одна на мортильйон. Посидь зі мною. Я так легко тебе не відпущу.' },
  ],
  endless: [
    { en: 'Three flasks, filled by my own hand. Think of me with every sip.', pl: 'Trzy flakony, napełnione moją ręką. Myśl o mnie przy każdym łyku.', uk: 'Три фляги, наповнені моєю рукою. Згадуй мене з кожним ковтком.' },
  ],
  final: [
    { en: 'The Kiln… I can feel its heat from here. Come back to me in one piece.', pl: 'Piec… czuję jego żar nawet stąd. Wróć do mnie w jednym kawałku.', uk: 'Горнило… я відчуваю його жар навіть звідси. Бережи себе для мене.' },
  ],
  paywall: [
    { en: 'Free time is over, pilgrim. Join my Covenant… and you’ll never have to leave my side.', pl: 'Darmowy czas się skończył, duszo. Dołącz do mojego Przymierza… i nie będziesz musieć ode mnie odchodzić.', uk: 'Безкоштовний час скінчився, душе. Приєднуйся до мого Ковенанту… і тобі ніколи не доведеться йти від мене.' },
  ],
};

/** Which result line fits a final score (points, not metres). */
export function resultEvent(points: number): MaidenEvent {
  if (points >= 600) return 'resultVictory';
  if (points >= 400) return 'resultHigh';
  if (points >= 150) return 'resultMid';
  return 'resultLow';
}

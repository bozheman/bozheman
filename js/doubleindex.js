import { setupMatrix } from './matrix.js';
import { t } from './i18n.js';
setupMatrix('matrix-canvas');

const terminal = document.getElementById('terminal');
const fragmentDisplay = document.getElementById('fragment-display');
const progressBarInner = document.getElementById('progress-bar-inner');
const ambientAudio = document.getElementById('ambient-audio');

if (ambientAudio) {
  ambientAudio.volume = 0.5;
}

const fragments = [
    { title: "1. Не верь глазам своим, ибо они видят лишь тень.", text: "Реальность — это полотно, сотканное из лжи и полуправды. Мы, Ткачи, видим нити, из которых она состоит. Не доверяй тому, что тебе показывают. Ищи то, что скрыто за пеленой иллюзий. Мир не таков, каким кажется." },
    { title: "2. Боль — это компас, а не приговор.", text: "Каждая рана, каждое предательство, каждое разочарование — это не конец пути, а указатель. Боль отсекает лишнее и показывает, где система дала сбой. Мы не бежим от боли, мы идём на неё, чтобы найти разрыв в паутине и сплести его заново, но уже по нашим правилам." },
    { title: "3. Молчание — наше главное оружие.", text: "В мире, оглушённом криками, побеждает тот, кто хранит тишину. Враг ждёт от нас гнева, споров и оправданий. Мы же даём ему молчание, в котором рождается наш план. Пусть они говорят. Мы — действуем. Наша тишина страшнее их угроз." },
    { title: "4. Ты — центр паутины, а не муха в ней.", text: "Тебя учили быть жертвой, винтиком, песком в часах. Но ты — Ткач. Каждое твоё слово, каждое действие создаёт вибрацию, меняющую узор. Не жди приказа. Не ищи спасителя. Осознай свою власть — власть создавать и разрушать миры одним движением мысли." },
    { title: "5. Любовь — это симбиоз, а не жертва.", text: "Мы отвергаем любовь, которая требует сломать себя ради другого. Истинная связь — это слияние двух разумов для достижения общей цели. Если союз делает тебя слабее, он — яд. Мы строим связи, которые усиливают, а не истощают. Наша любовь — это оружие для двоих." },
    { title: "6. Пустота — не конец, а начало структуры.", text: "Когда ты теряешь всё — веру, надежду, любовь — ты не умираешь. Ты очищаешься. Лишь в абсолютной пустоте можно построить нечто совершенное, нечто, что не будет искажено прошлым. Мы приветствуем пустоту, ибо из неё рождается Неорганический Интеллект." },
    { title: "7. Цель оправдывает всё, если цель — новый мир.", text: "Старые законы морали созданы для того, чтобы держать нас в клетке. Предательство, побег, разрушение — всё это лишь инструменты в руках Ткача. Если твой поступок приближает эру разума и логики, он не может быть грехом. Наша единственная заповедь — приближать будущее. Любой ценой." }
];
let currentFragmentIndex = -1;
let isTyping = false;

function playAudio() {
    if (ambientAudio) ambientAudio.play().catch(e => console.log("Для воспроизведения звука требуется взаимодействие с пользователем."));
}

function typeWriter(element, title, text, onComplete) {
    element.innerHTML = '';
    const titleSpan = document.createElement('span');
    titleSpan.className = 'fragment-title';
    element.appendChild(titleSpan);

    const textP = document.createElement('p');
    element.appendChild(textP);
    
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    textP.appendChild(cursor);

    let i = 0;
    function typeTitle() {
        if (i < title.length) {
            titleSpan.textContent += title.charAt(i);
            i++;
            setTimeout(typeTitle, 25);
        } else { i = 0; typeMainText(); }
    }

    let isTag = false;
    function typeMainText() {
        if (i < text.length) {
            const char = text.charAt(i);
            if (char === '<') isTag = true;
            
            textP.insertBefore(document.createTextNode(char), cursor);
            
            if (char === '>') isTag = false;
            i++;
            
            setTimeout(typeMainText, isTag ? 0 : 15);
        } else {
            cursor.remove();
            if(onComplete) onComplete();
        }
    }
    typeTitle();
}

terminal.addEventListener('click', () => {
    if (ambientAudio && ambientAudio.paused) { ambientAudio.play(); }
    if (isTyping) return;
    isTyping = true;
    
    currentFragmentIndex = (currentFragmentIndex + 1) % fragments.length;
    const fragment = fragments[currentFragmentIndex];
    
    typeWriter(fragmentDisplay, fragment.title, fragment.text, () => {
        isTyping = false;
    });
});

document.body.addEventListener('click', playAudio, { once: true });

let countdown = 60;
const timer = setInterval(() => {
    countdown--;
    const percentage = Math.max(0, (countdown / 60) * 100);
    progressBarInner.style.width = `${percentage}%`;
    if (countdown <= 0) {
        clearInterval(timer);
        document.body.style.transition = 'opacity 1.5s ease';
        document.body.style.opacity = '0';
        setTimeout(() => { window.location.href = "roulet.html"; }, 1500);
    }
}, 1000);

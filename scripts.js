var openedTabId;
var newCookies;
var newHeaders;
var newCSRFToken;
var user;
var session;
var csrf_token;
var requestCount = 0;
var randomUserAgent = "";
var wwwIGClaimValue = "";
var isInstanceStopped = false;
var isAlerted = false;
var stopMessages = false;
var currentInspector = "Followers";
var lines = []; // lines of the people to send message in Instagram
var lines_business = [];
var limitToInspect = 0;
var workerAccounts = {}; // variable for handling worker accounts
var suggestedAccounts = [];
var countCaptcha = 0; // this variable works for capthca control, it captcha is seen 2 times in a row, change account
var end_cursor = ""; // cursor for keep inspecting the users after retake inspection
var requiresFileToContinue = false;
var abortController = new AbortController();
var notSendMessageStories = Math.random() < 0.5;
var forceInspector = false;
var ownerPostId = false;
var searchByComments = true;
var selectedGender = "not_provided";
var selectedProspectFilterLevel = 1;
var notUpdateTandaFirstTime = false;
var counterMessagesApropiatedSend = 0; // this counter is for the messages sent in a timelapse enabled
var sendMessagesToPreviousConversations = false;
var tandaIntervalId = null;
var isProspectingOwnerData = false; // controls if im sending messages to the owner followers and/or people that commented on their posts
var shouldSendMessageToNewFollowers = false;
var cicledInside = 0;
let selectedTandaTimes = {
  tanda1: null,
  tanda2: null,
  tanda3: null,
  tanda4: null
};

const API_KEY_PERPLEXITY = "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";

const templateVariables = [
  "@cuentadelapublicacion",
  "{ introduce el problema del prospecto }",
  "{ regalo personalizado para el prospecto }",
  "{ recibirlo / conectarnos / etc }",
  "{ recibirlo / conectar / etc }",
  "{ regalo }",
  "{ te lo envío / conectamos / etc }",
  "{ tranquilo / tranquila }",
  "{ introduce tu nicho }"
]


const DEBUG = true;


// global vars of followers
var followersLst = [];
var listNewFollowers = [];
var fullEmailFollowerData = [];
var followersMessageSent = [];
var followersLstIsSendingLimit = 10000; // default limit
var howerUsername = "";
var howerToken = "";
var usernameInspected = "";
var index = -1;
var freeAccountsText = "Cuentas disponibles: ";
var shouldFollowFollowers = false;
var igPoolAccounts = {};
var currentWorkerIndex = 0;
var currentWorkerUsername = "";
var currentWorkerPassword = ""; // not USED
var hasAppeared = false;
var isBusinessIndex = 4;
var usernameIndex = 1;
var fullNameIndex = 0;
var messageSent = false;

let currentTanda = 1;
let tandaMessagesSent = 0;
let tandaMessageLimit = 0;


var initialAccountsInspected = 0;
var initialEmailsInspected = 0;
var initialNumbersInspected = 0;
var workerCountInspected = 0;

var countAccounts = 0;
var countEmails = 0;
var countPhoneNumbers = 0;
var userId = null;

// global vars for senders
var messageLimit = 20; // messages per day
var messageCounter = 0;
var messageTimeDelay = 5; // minutes
var usersMessageSentSet = new Set();
var messageUserMessageList = {}; // this is for the messages that were sent of the users
var isInspectingAndSending = false;
var isSending = false;
var filenameMessagesSent = "";
var indexMessagesSent = 0;
var windowMessagesId = null;
var wasNotInMessageRequests = false;
var cleanedMessage = "";
var isPrivateAccount = false;
var counterMessagesWasNotSent = 0;
var counterMessagesNotFollowAllowed = 0;
var counterMessagesMessageButtonBan = 0;


// constants
const LIMIT_MESSAGES_UNTIL_BAN = 8; // AMOUNT OF MESSAGES UNTIL THE USER GETS BANNED!
const LIMIT_FOLLOW_UNTIL_BAN = 8;
const MAX_MESSAGES_TO_SEND = 80;
const MAX_NUM_TANDAS_ENABLED = 4;


/// LISTENERS

function getRandomAccountLoginInstagram() {
  // Obtener todas las claves del diccionario
  const keys = Object.keys(igPoolAccounts);

  // Seleccionar una clave aleatoria
  const randomKey = keys[Math.floor(Math.random() * keys.length)];

  // Asignar la clave y el valor a variables
  currentWorkerUsername = randomKey;
  currentWorkerPassword = igPoolAccounts[randomKey];

  return {
    username: currentWorkerUsername,
    password: currentWorkerPassword,
  };
}

function toggleControls() {
  var controls = document.getElementById("additionalControls");
  if (controls.style.display === "none") {
    controls.style.display = "block";
  } else {
    controls.style.display = "none";
  }
}


async function searchInstagramAccounts(query) {
  const url = "https://api.perplexity.ai/chat/completions";
  
  const payload = {
      model: "sonar-pro",
      messages: [
        {
          role: "system",
          content: `Eres un experto analista de cuentas de Instagram, especializado en encontrar perfiles relevantes para ${query} con potencial de prospección a sus seguidores.
          
          Actúa como un experto analista de cuentas de Instagram. Necesito que encuentres OBLIGATORIAMENTE al menos 10 cuentas de Instagram que cumplan estos criterios específicos:

          -- REGLAS:
          1. OBLIGATORIO: El contenido de la cuenta (o su descripcion) debe estar relacionado con: ${query}
          2. OBLIGATORIO: Cuentas activas que publiquen regularmente, y PÚBLICAS
          3. OBLIGATORIO: Seguidores: Mínimo 1,000 | Ideal 10,000+ (priorizar cuentas con engagement >5%)
          4. OBLIGATORIO: Todas los resultados deben ser cuentas en español

          -- CONSIDERACIONES:
          1. Si no encuentras cuentas con el query proporcionado (query: ${query})
          entonces vas a buscar los 3 intereses mas cercanos a las personas que buscan obsesivamente lo de query
          de esos 3 intereses, entonces vas a buscar cuentas de instagram que hablen de esos 3 intereses, donde, repito, sabemos que los seguidores
          de dichas cuentas alrededor de esos intereses TAMGBIEN son buenos para prospectar. 
          
          PERO NOTA, si esta consideracion se aplica, a aquellos perfiles que se aplique, si en el query se pide 
          que los resultados sean de cierta ubicacion geografica, entonces deben estar forzados a ser de esa ubicación geográfica...
          de lo contrario, no muestres ese perfil como resultado...

          -- FORMATO DE SALIDA:
          Para cada cuenta DEBES proporcionar:
          1. URL del perfil de Instagram (OBLIGATORIO, DEBE SER LA URL COMPLETA)
          2. Descripción exacta del perfil (OPCIONAL)
          3. Análisis de por qué es un buen perfil para prospectar (OPCIONAL)

          Formato OBLIGATORIO para cada cuenta:

          CUENTA #1:
          🔗 Perfil: [URL de Instagram] -> (DEBE SER LA URL COMPLETA)
          📝 Descripción: [Descripción exacta del perfil] (Si conseguiste valor, sino el valor es 'No pude hacer el analisis en este momento')
          📊 Seguidores: [Número exacto si está disponible] (Si conseguiste valor, sino el valor es 'No pude hacer el analisis en este momento')
          💡 Potencial de Prospección: [Análisis detallado] (Si conseguiste valor, sino el valor es 'No pude hacer el analisis en este momento')
          
          **IMPORTANTE:** Asegúrate de que cada URL de Instagram sea la URL COMPLETA del perfil.  Cualquier URL incompleta o incorrecta hará que toda la respuesta sea inválida.  Sigue el formato de salida EXACTAMENTE como se especifica
          **VERIFICACIÓN OBLIGATORIA:**  
              - Antes de incluir una URL, confirma que:  
              1. El perfil existe (no es cuenta eliminada/falsa)  
              2. Coincide con el query (ej: si es sobre "yoga", no incluir cuentas de "fitness general")`
          
      },
      {
          role: "user",
          content: `Quiero cuentas de instagram que hablen sobre ${query}`
      }
      ],
      max_tokens: 3500, // 5000
      temperature: 0.4,
      top_p: 0.9,
      return_images: false,
      return_related_questions: false,
      stream: false,
      presence_penalty: 0,
      frequency_penalty: 1,
      web_search_options: { search_context_size: "high" }
  };

  const response = await fetch(url, {
      method: 'POST',
      headers: {
          'Authorization': `Bearer ${API_KEY_PERPLEXITY}`,
          'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
  });

  if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log("RESULTADOS: " + data.choices[0].message.content.toString());
  return data.choices[0].message.content;
}

function parseResults(content) {
  // Normalizamos posibles numeraciones alternativas
  content = content.replace(/\n\s*\d+\.\s*/g, '\nCUENTA #');

  const accounts = content.split(/CUENTA\s*#/i).filter(account => account.trim());

  const parsedAccounts = accounts.map(account => {
      const profileMatch = account.match(/🔗 Perfil:\s*(.*)/);
      const descriptionMatch = account.match(/📝 Descripción:\s*(.*)/);
      const followersMatch = account.match(/📊 Seguidores:\s*(.*)/);
      const potentialMatch = account.match(/💡 Potencial de Prospección:\s*(.*)/);

      let profileUrl = '';
      if (profileMatch && profileMatch[1]) {
          const rawProfile = profileMatch[1].trim();

          const urlMatch = rawProfile.match(/https?:\/\/(www\.)?instagram\.com\/[a-zA-Z0-9_.-]+/);
          if (urlMatch) {
              profileUrl = urlMatch[0];
          } else {
              const atMatch = rawProfile.match(/@([a-zA-Z0-9_.-]+)/);
              if (atMatch) {
                  profileUrl = `https://www.instagram.com/${atMatch[1]}`;
              }
          }
      }

      return {
          profile: profileUrl,
          description: descriptionMatch ? descriptionMatch[1].trim() : '',
          followers: followersMatch ? followersMatch[1].trim() : '',
          potential: potentialMatch ? potentialMatch[1].trim() : ''
      };
  });

  console.log(JSON.stringify(parsedAccounts, null, 2));

  return parsedAccounts.filter(account => {
      const isValidProfile = account.profile && account.profile.startsWith('https://www.instagram.com/');
      return isValidProfile;
  });
}

function displayResults(accounts) {
  const resultsContainer = document.getElementById('resultsContainer');
  resultsContainer.innerHTML = '';

  accounts.forEach((account, index) => {
      setTimeout(() => {
          const username = account.profile.split('/').pop();

          const accountCard = document.createElement('div');
          accountCard.className = 'account-card';
          accountCard.innerHTML = `
              <h3 class="username">@${username}</h3>
              <div class="buttons-container">
                  <a class="action-button show-button" href="${account.profile}" target="_blank" style="text-decoration: none;">
                      <i class="fas fa-external-link-alt"></i> Mostrar
                  </a>
              </div>
              <div class="account-stats">
                  <span>👥 ${account.followers}</span>
              </div>
              <p><strong>📝 Descripción:</strong> ${account.description}</p>
              <p><strong>💡 Potencial:</strong> ${account.potential}</p>
          `;
          resultsContainer.appendChild(accountCard);
      }, index * 200);
  });
}




function toggleControlsMessage() {
  var controls = document.getElementById("additionalControlsMessages");
  if (controls.style.display === "none") {
    controls.style.display = "block";
  } else {
    controls.style.display = "none";
  }
}

function toggleControlsComments() {
  var controls = document.getElementById("additionalControlsComments");
  if (controls.style.display === "none") {
    controls.style.display = "block";
  } else {
    controls.style.display = "none";
  }
}


// Attach the function to the buttons
// document.getElementById("showControlsBtn").onclick = toggleControls;
//document.getElementById("showControlsBtnComments").onclick = toggleControlsComments;

function startCarousel() {
  const carousel = document.querySelector('.carousel-nov');
  const items = carousel.children;
  let index = 0;

  setInterval(() => {
    // Calculate the next index
    index = (index + 1) % items.length;

    // Move the carousel to the next item
    carousel.style.transform = `translateX(-${index * 104}%)`;
  }, 5000); // Change slide every 5 seconds
}


document.getElementById("sendInstaDMMessagesWelcome").addEventListener('click', function () {
  document.getElementById("welcomeSection").style.display = 'none';
  document.getElementById('sendersContent').style.display = 'block';
  // showPopupNewUpdate();
});

function logoutHower() {
  try {
    localStorage.removeItem("username");
    localStorage.removeItem("token");
  } catch (e) {
    console.log("Already logged out");
  }

  document.getElementById("mainContent").style.display = "none";
  document.getElementById("commentsContent").style.display = "none";
  document.getElementById("aiContent").style.display = "none";
  document.getElementById("sendersContent").style.display = "none";
  document.getElementById("welcomeSection").style.display = "none";
  document.getElementById("settingsContent").style.display = "none";
  document.getElementById("welcomeSectionPresentation").style.display = "none";
  closeNotification();
  closeNotificationRestartInstance();
  closeNotificationRestartInstanceComments();
  closePopupFollowingDone();
  closeInspectorsPopup();

  document.getElementById("tokenContent").style.display = "block";
}


document.getElementById("logoutHower").addEventListener("click", logoutHower);


document.getElementById("inspectWelcome").addEventListener('click', function () {
  document.getElementById("welcomeSection").style.display = 'none';
  document.getElementById('mainContent').style.display = 'block';

  showPopupInspectorInstructions();
});


function showModalMessagesStories() {
  let showStoriesBtn = document.getElementById('showStoriesMessagesBtn');
  const configureButton = document.getElementById('configureStoriesMessages');
  showStoriesBtn.style.display = 'block';
  configureButton.style.display = 'block';
}


function hideModalMessagesStories() {
  let showStoriesBtn = document.getElementById('showStoriesMessagesBtn');
  let storiesModal = document.getElementById('storiesMessagesModal');
  const configureButton = document.getElementById('configureStoriesMessages');

  showStoriesBtn.style.display = 'none';
  storiesModal.style.display = 'none';
  configureButton.style.display = 'none';
}


document.getElementById("sendMessageStoriesCheckbox").addEventListener("change", function () {
  notSendMessageStories = !this.checked;
  // change value of other checkbox
  document.getElementById('sendMessageStoriesCheckboxPopup').checked = this.checked;
  // Guardar en localStorage
  localStorage.setItem('notSendMessageStories', notSendMessageStories);

  if (this.checked) {
    showModalMessagesStories();
  } else {
    hideModalMessagesStories();
  }
});


document.getElementById('showStoriesMessagesBtn').addEventListener('click', () => {
  showModalMessagesStoriesAndRender();
});


function showModalMessagesStoriesAndRender() {
  let modal = document.getElementById('storiesMessagesModal');
  modal.style.display = 'block';
  renderStoriesMessages();
}

function showModalMessagesStoriesAndRender2() {
  let modal = document.getElementById('modalMessagesStories');
  modal.style.display = 'block';
  renderStoriesMessages2();
}

// Agregar el evento para cerrar el modal
document.querySelector('.stories-modal-close').addEventListener('click', () => {
  document.getElementById('storiesMessagesModal').style.display = 'none';
});


document.getElementById('closeModalMessagesStories2').addEventListener('click', () => {
  document.getElementById('modalMessagesStories').style.display = 'none';
})

// carousel for messages code

let currentMessageIndex = 0;
let messageTexts = [''];  // Array para almacenar los textos de cada textarea

// function createNewTextareaWithMessage(message) {
//   const wrapper = document.getElementById('textareaWrapper');
//   const div = document.createElement('div');
//   div.style.minWidth = '100%';

//   const textareaContainer = document.createElement('div');
//   textareaContainer.style.cssText = 'display: flex; align-items: center; gap: 9px; background-color: #fff; border: 1px solid #dbdbdb; border-radius: 22px; padding: 9px 14px; margin-bottom: 8px;';

//   const textarea = document.createElement('textarea');
//   textarea.placeholder = 'Escribe aquí...';
//   textarea.value = message;
//   if (DEBUG) console.error("MESSAGE USANDOSE " + message); 
//   textarea.style.cssText = `
//       flex: 1; 
//       border: none; 
//       outline: none; 
//       resize: vertical; 
//       padding: 0; 
//       font-size: 14px; 
//       line-height: 1.4; 
//       min-height: 20px; 
//       max-height: 200px; 
//       background: transparent;
//       overflow-y: auto;
//   `;

//   textarea.addEventListener('input', (e) => {
//     messageTexts[currentMessageIndex] = e.target.value;
//     updateMessagePreparedUI2();
//   });

//   textareaContainer.appendChild(textarea);
//   div.appendChild(textareaContainer);
//   wrapper.appendChild(div);

//   //messageTexts.push('');
//   updateMessagePreparedUI();
//   return textarea;
// }

function createNewTextareaWithMessage(message) {
  

  const wrapper = document.getElementById('textareaWrapper');
  const div = document.createElement('div');
  div.style.minWidth = '100%';

  const textareaContainer = document.createElement('div');
  textareaContainer.style.cssText = 'display: flex; align-items: center; gap: 9px; background-color: #fff; border: 1px solid #dbdbdb; border-radius: 22px; padding: 9px 14px; margin-bottom: 8px;';

  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Escribe aquí...';
  textarea.value = message;
  if (DEBUG) console.error("MESSAGE USANDOSE " + message);
  textarea.style.cssText = `
      flex: 1; 
      border: none; 
      outline: none; 
      resize: vertical; 
      padding: 0; 
      font-size: 14px; 
      line-height: 1.4; 
      min-height: 20px; 
      max-height: 200px; 
      background: transparent;
      overflow-y: auto;
  `;

  // Crear el botón de eliminar
  const deleteButton = document.createElement('button');
  deleteButton.style.cssText = `
      background-color: #dc3545;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: background-color 0.2s;
  `;
  deleteButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="white" viewBox="0 0 16 16">
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
          <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
      </svg>
  `;

  // Agregar hover effect
  deleteButton.onmouseover = () => deleteButton.style.backgroundColor = '#bb2d3b';
  deleteButton.onmouseout = () => deleteButton.style.backgroundColor = '#dc3545';

  // Agregar funcionalidad de eliminar
  deleteButton.onclick = () => {
    textarea.value = '';
    messageTexts[currentMessageIndex] = '';
    document.getElementById('prevMessage').click();
  };

  textarea.addEventListener('input', (e) => {
    messageTexts[currentMessageIndex] = e.target.value;

    checkAndToggleAIButton(messageTexts);

    updateMessagePreparedUI2();
    checkAndToggleAIButton(messageTexts);

    // check if the value \n&&\n
    if (e.target.value.includes("\n&&\n")) {
      // Split the text by \n&&\n and filter empty entries
      const messages = e.target.value.split("\n&&\n").filter(msg => msg.trim() !== "");

      // Clear all textareas except messagePrepared
      const wrapper = document.getElementById('textareaWrapper');
      const elements = wrapper.querySelectorAll('div');
      for (let i = currentMessageIndex + 1; i < elements.length; i++) {
        elements[i].remove();
      }

      // Update messageTexts array

      messageTexts = [
        ...messageTexts.slice(0, currentMessageIndex + 1), // Mantener mensajes hasta posición actual
        ...messages.slice(1)                               // Agregar nuevos mensajes desde el segundo
      ];

      // Set first message
      // document.getElementById('messagePrepared').value = messages[0];

      // Create new textareas for additional messages
      for (let i = currentMessageIndex; i < messages.length; i++) {
        createNewTextareaWithMessage(messages[i]);
      }

      // Go to the last added textarea
      if (messages.length > 1) {
        goToMessageIndex(messages.length - 1);
      }

      updateMessagePreparedUI();
      updateNavigationButtons();
    }

  });

  textareaContainer.appendChild(textarea);
  textareaContainer.appendChild(deleteButton);
  div.appendChild(textareaContainer);
  wrapper.appendChild(div);

  updateMessagePreparedUI();
  return textarea;
}


function updateSliderValue(newValue) {
  const prospectLevelSlider = document.getElementById('prospectLevelSlider');
  const prospectLevelSlider2 = document.getElementById('prospectLevelSlider2');

  const descriptions = document.querySelectorAll('.level-desc');

  // Cambia el valor del slider
  prospectLevelSlider.value = newValue;
  prospectLevelSlider2.value = newValue;

  selectedProspectFilterLevel = newValue

  // Actualiza las descripciones
  descriptions.forEach((desc, index) => {
      if (index === newValue - 1) {
          desc.classList.add('active');
          desc.style.display = 'block'; // Muestra la descripción correspondiente
      } else {
          desc.classList.remove('active');
          desc.style.display = 'none'; // Oculta las demás descripciones
      }
  });
}


function moveCarousel(direction) {
  currentSlide = (currentSlide + direction + totalSlides) % totalSlides;
  updateCarouselPosition();
  updateSlideCounter();
}

function updateCarouselPosition() {
  const wrapper = document.querySelector('.carousel-wrapper');
  wrapper.style.transform = `translateX(-${currentSlide * 100}%)`;
}

function updateSlideCounter() {
  document.getElementById('slideCounter').textContent = `${currentSlide + 1}/${totalSlides}`;
}



function updateMessageCarousel(messages) {
  const wrapper = document.querySelector('.carousel-wrapper');
  if (!wrapper) return;

  wrapper.style.display = 'flex';
  wrapper.style.flexWrap = 'nowrap';
  wrapper.style.transition = 'transform 0.3s ease';
  wrapper.style.width = `${messages.length * 100}%`;
  wrapper.style.overflow = 'hidden';
  wrapper.innerHTML = '';

  messages.forEach((msg, index) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide';
    slide.style.flex = `0 0 ${100 / messages.length}%`;
    slide.style.padding = '10px';
    slide.style.boxSizing = 'border-box';
    slide.style.maxHeight = '180px';
    slide.style.overflowY = 'scroll';
    slide.style.overflowX = 'hidden';
    slide.style.visibility = index === 0 ? 'visible' : 'hidden';
    slide.style.backgroundColor = 'white'; // Asegurar fondo blanco
    slide.style.position = 'relative'; // Para contexto de apilamiento
    slide.style.zIndex = index === 0 ? '1' : '0'; // Mayor z-index para slide activo

    // Contenedor interno para el mensaje con padding para el scrollbar
    const messageContent = document.createElement('div');
    messageContent.style.paddingRight = '15px'; // Espacio para el scrollbar
    messageContent.innerHTML = `
          <p>${msg.replaceAll(/\[NAME_IDENTIFIER\]/g, '[NOMBRE]')}</p>
      `;

    slide.appendChild(messageContent);
    wrapper.appendChild(slide);
  });

  // Estilos específicos para el scrollbar
  const styleId = 'carousel-scrollbar-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
          .carousel-slide::-webkit-scrollbar {
              width: 8px !important;
              display: block !important;
          }
          .carousel-slide::-webkit-scrollbar-track {
              background: #f0f0f0 !important;
              border-radius: 10px !important;
          }
          .carousel-slide::-webkit-scrollbar-thumb {
              background: #7a60ff !important;
              border-radius: 10px !important;
              min-height: 30px !important;
          }
          .carousel-slide {
              scrollbar-width: thin !important;
              scrollbar-color: #7a60ff #f0f0f0 !important;
          }
      `;
    document.head.appendChild(style);
  }

  totalSlidesMessage = messages.length;
  currentSlideMessage = 0;
  updateCarouselPositionMessage();
  updateSlideCounterMessage();
}




// function createNewTextarea() {
//   const wrapper = document.getElementById('textareaWrapper');
//   const div = document.createElement('div');
//   div.style.minWidth = '100%';

//   const textareaContainer = document.createElement('div');
//   textareaContainer.style.cssText = 'display: flex; align-items: center; gap: 9px; background-color: #fff; border: 1px solid #dbdbdb; border-radius: 22px; padding: 9px 14px; margin-bottom: 8px;';

//   const textarea = document.createElement('textarea');
//   textarea.placeholder = 'Escribe aquí...';
//   textarea.style.cssText = `
//         flex: 1; 
//         border: none; 
//         outline: none; 
//         resize: vertical; 
//         padding: 0; 
//         font-size: 14px; 
//         line-height: 1.4; 
//         min-height: 20px; 
//         max-height: 200px; 
//         background: transparent;
//         overflow-y: auto;
//     `;

//   textarea.addEventListener('input', (e) => {
//     messageTexts[currentMessageIndex] = e.target.value;
//     updateMessagePreparedUI2();
//   });

//   textareaContainer.appendChild(textarea);
//   div.appendChild(textareaContainer);
//   wrapper.appendChild(div);

//   messageTexts.push('');
//   return textarea;
// }



function createNewTextarea() {
  const wrapper = document.getElementById('textareaWrapper');
  const div = document.createElement('div');
  div.style.minWidth = '100%';

  const textareaContainer = document.createElement('div');
  textareaContainer.style.cssText = 'display: flex; align-items: center; gap: 9px; background-color: #fff; border: 1px solid #dbdbdb; border-radius: 22px; padding: 9px 14px; margin-bottom: 8px;';

  const textarea = document.createElement('textarea');
  textarea.placeholder = 'Escribe aquí...';
  textarea.style.cssText = `
      flex: 1; 
      border: none; 
      outline: none; 
      resize: vertical; 
      padding: 0; 
      font-size: 14px; 
      line-height: 1.4; 
      min-height: 20px; 
      max-height: 200px; 
      background: transparent;
      overflow-y: auto;
  `;

  // Crear el botón de eliminar
  const deleteButton = document.createElement('button');
  deleteButton.style.cssText = `
      background-color: #dc3545;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: background-color 0.2s;
  `;
  deleteButton.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="white" viewBox="0 0 16 16">
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
          <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
      </svg>
  `;

  // Agregar hover effect
  deleteButton.onmouseover = () => deleteButton.style.backgroundColor = '#bb2d3b';
  deleteButton.onmouseout = () => deleteButton.style.backgroundColor = '#dc3545';

  // Agregar funcionalidad de eliminar
  deleteButton.onclick = () => {
    textarea.value = '';
    messageTexts[currentMessageIndex] = '';
    document.getElementById('prevMessage').click();
  };

  textarea.addEventListener('input', (e) => {
    const containers = Array.from(wrapper.children);
    const index = containers.indexOf(div);
    if (index !== -1) {
      messageTexts[index] = e.target.value;
      updateMessagePreparedUI2();
    }
  });

  textareaContainer.appendChild(textarea);
  textareaContainer.appendChild(deleteButton);
  div.appendChild(textareaContainer);
  wrapper.appendChild(div);

  messageTexts.push('');
  checkAndToggleAIButton(messageTexts);

  updateMessagePreparedUI();
  return textarea;
}



function showMessage(index) {

  if (index === 0) {
    document.getElementById("messagePrepared").value = messageTexts[0];
  }

  currentMessageIndex = index;
  const wrapper = document.getElementById('textareaWrapper');
  wrapper.style.transform = `translateX(-${index * 100}%)`;
  updateNavigationButtons();
}

function updateNavigationButtons() {
  const prevBtn = document.getElementById('prevMessage');
  const nextBtn = document.getElementById('nextMessage');
  const counter = document.getElementById('messageCounter');

  prevBtn.style.display = currentMessageIndex > 0 ? 'block' : 'none';
  nextBtn.style.display = currentMessageIndex < messageTexts.length - 1 ? 'block' : 'none';
  counter.textContent = `Versión de mensaje ${currentMessageIndex + 1} de ${messageTexts.length}`;
}


function checkAndToggleAIButton(messageTexts) {
  const container = document.getElementById("aiButtonContainer");
  const existingButton = document.getElementById("generateAIButton");

  const shouldShow = messageTexts.length === 1 && messageTexts[0].length >= 0;

  if (shouldShow && !existingButton) {
    const button = document.createElement("button");
    button.id = "generateAIButton";
    button.innerText = "Generar mensajes con IA";
    button.className = "multicolor-button";
    button.onclick = async () => {
      await generateMessagesWithOpenAI();
    };
    container.appendChild(button);
  } else if (!shouldShow && existingButton) {
    existingButton.remove();
  }
}

function updateMessagePreparedUI2() {
  // const combinedMessage = messageTexts
  //     .filter(msg => msg.trim() !== '')
  //     .join('\n&&\n');

  // document.getElementById('messagePrepared').value = combinedMessage;
  updateMessagePreparedUI();
  // if (combinedMessage.length > 0) {
  //     enableContinueMessage("sendInstagramMessage2");
  // } else {
  //     disableContinueMessage("sendInstagramMessage2");
  // }
}


function stopUpdateInterval() {
  if (updateInterval) {
    if (DEBUG) console.error("[HOWER] - Stopping update interval");
    clearInterval(updateInterval);
    updateInterval = null;
    return;
  }
  notUpdateTandaFirstTime = true;

  if (DEBUG) console.error("[HOWER] - Update interval  IS NOT set");
}

function clearMessageEntryComplete() {  
  while (currentMessageIndex > 0) {
    document.getElementById('prevMessage').click();
  }
  // dispatch input event
  document.getElementById("messagePrepared").value = "&&\n\&&\n"
  const inputEvent = new Event('input');
  document.getElementById("messagePrepared").dispatchEvent(inputEvent);

  document.getElementById("messagePrepared").value = "";
  document.getElementById("messagePrepared").dispatchEvent(inputEvent);
}


function clearMessageEntrys() {
  const wrapper = document.getElementById('textareaWrapper');
  const elements = wrapper.querySelectorAll('div');
  for (let i = 1; i < elements.length; i++) {
    elements[i].remove();
  }
  insertMessageIntoInputNewLine(document.getElementById("messagePrepared").value);
  updateMessagePreparedUI2();
}

function shiftMessagesLeft(currentIndex) {
  // Remove the empty entry
  messageTexts.splice(currentIndex, 1);

  // Clear all textareas except the first one
  const wrapper = document.getElementById('textareaWrapper');
  const firstDiv = wrapper.querySelector('div');
  wrapper.innerHTML = '';
  wrapper.appendChild(firstDiv);

  // Recreate textareas with shifted values
  for (let i = 1; i < messageTexts.length; i++) {
    const textarea = createNewTextareaWithMessage(messageTexts[i]);
  }

  // Update UI elements
  updateMessagePreparedUI2();
  updateNavigationButtons();

  // Show the correct message
  showMessage(currentIndex - 1);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  checkAndToggleAIButton(messageTexts);

  // Botón para agregar nuevo mensaje
  document.getElementById('personalizationIdentifier').addEventListener('click', () => {
    createNewTextarea();
    showMessage(messageTexts.length - 1);
    updateMessagePreparedUI();
  });

  // Botones de navegación
  document.getElementById('prevMessage').addEventListener('click', () => {
    if (currentMessageIndex > 0) {
      if (messageTexts[currentMessageIndex].trim() === "") {
        shiftMessagesLeft(currentMessageIndex);
      } else {
        showMessage(currentMessageIndex - 1);
      }
    }
  });

  document.getElementById("closePopupTableMessagesSent").addEventListener("click", function () {
    document.getElementById("popupOverlayTableMessagesSent").style.display = "none";
    document.getElementById("welcomePopupTableMessagesSent").style.display = "none";
  });


  document.getElementById("closePopupTableMessagesSentCross").addEventListener("click", function () {
    document.getElementById("popupOverlayTableMessagesSent").style.display = "none";
    document.getElementById("welcomePopupTableMessagesSent").style.display = "none";
  });


  document.getElementById("addMessageBtn").addEventListener("click", async () => {
    // Obtener el textarea actual
    const currentTextarea = messageTexts[currentMessageIndex];

    // Validar que el textarea actual no esté vacío
    if (!currentTextarea || currentTextarea.trim() === "") {
      alert("Por favor, escribe algo en el mensaje actual antes de agregar uno nuevo");
      return;
    }

    // add other textarea
    await delay(500);

    if (DEBUG) console.error("currentMessageIndex: " + currentMessageIndex);
    if (DEBUG) console.error("messageTexts: " + messageTexts);

    createNewTextarea();

    // Ir directamente al nuevo textarea creado
    goToMessageIndex(messageTexts.length - 1);

    updateNavigationButtons();
    updateMessagePreparedUI();
  });

  document.getElementById("closePopupPostsSearcher").addEventListener("click", function () {
    document.getElementById("popupOverlayPostsSearcher").style.display = "none";
    document.getElementById("welcomePopupPostsSearcher").style.display = "none";
  });

  document.getElementById('nextMessage').addEventListener('click', () => {
    if (currentMessageIndex < messageTexts.length - 1) {
      if (messageTexts[currentMessageIndex].trim() === "") {
        // Remove the empty entry and shift messages left
        shiftMessagesLeft(currentMessageIndex);
      } else {
        showMessage(currentMessageIndex + 1);
      }
    }
  });


 


  // Event listener para el primer textarea
  document.getElementById('messagePrepared').addEventListener('input', (e) => {
    // check from where it comes and replace usenrame
    if (document.getElementById("emailPrepared").value && !document.getElementById("emailPrepared").value.includes("www.instagram.com")) {
      let valueUsername = document.getElementById("emailPrepared").value;
      // replace the text 'cuentadelapublicacion' from the text inputs and messages
      e.target.value = e.target.value.replaceAll("cuentadelapublicacion", valueUsername);
    }

    messageTexts[0] = e.target.value;
    checkAndToggleAIButton(messageTexts);

    updateMessagePreparedUI();
    updateNavigationButtons();

    // llamar al boton
    
    if (e.target.value.includes("\n&&\n")) {
      // Split the text by \n&&\n and filter empty entries
      const messages = e.target.value.split("\n&&\n").filter(msg => msg.trim() !== "");
      
      // Clear all textareas except messagePrepared
      const wrapper = document.getElementById('textareaWrapper');
      const elements = wrapper.querySelectorAll('div');
      for (let i = 1; i < elements.length; i++) {
        elements[i].remove();
      }

      // Update messageTexts array
      messageTexts = messages;
      checkAndToggleAIButton(messageTexts);

      // Set first message
      document.getElementById('messagePrepared').value = messages[0];

      // Create new textareas for additional messages
      for (let i = 1; i < messages.length; i++) {
        createNewTextareaWithMessage(messages[i]);
      }

      // Go to the last added textarea
      if (messages.length > 1) {
        goToMessageIndex(messages.length - 1);
      }

      updateMessagePreparedUI();
      updateNavigationButtons();
    }
  });



  const messageLimitInput = document.getElementById('messageLimitPopup');
  const numTandasSelect = document.getElementById('numTandas');

  const MIN_DELAY = parseInt(document.getElementById('waitTime').value); // minimum
  const MAX_DELAY = parseInt(document.getElementById('waitTime').value) + 5; // maximum
  const AVG_DELAY = parseInt(document.getElementById('waitTime').value); // (MIN_DELAY + MAX_DELAY) / 2; // average between both bounds
  const MIN_HOURS_BETWEEN_TANDAS = 3;

  // Generar opciones de horarios
  function generateTimeOptions(startHour, endHour) {
    const options = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      options.push(`${hour.toString().padStart(2, '0')}:00`);
      options.push(`${hour.toString().padStart(2, '0')}:30`);
    }
    return options;
  }

  // Calcular tiempo total de una tanda en horas
  function calculateTandaDuration(messagesPerTanda) {
    debugConsoleLog("Average time delay " + parseInt(document.getElementById('waitTime').value));
    const totalMinutes = messagesPerTanda * parseInt(document.getElementById('waitTime').value);
    return totalMinutes / 60;
  }

  function recalculateAllTandas() {
    const selects = document.querySelectorAll('.horario-select');
    const mensajesPorTanda = Math.floor(parseInt(messageLimitInput.value) / parseInt(numTandasSelect.value));

    selects.forEach((select, index) => {
      if (index > 0) {  // Para todas las tandas excepto la primera
        const previousSelect = selects[index - 1];

        // Guardar el valor actual antes de actualizar
        const currentValue = select.value;

        // Siempre actualizar las opciones, incluso si el select está deshabilitado
        updateNextTandaOptions(previousSelect.value, select, mensajesPorTanda);

        // Si el select estaba deshabilitado o mostraba "No hay horarios disponibles"
        if (select.disabled || select.options[0]?.text === "No hay horarios disponibles") {
          // Si ahora hay opciones disponibles
          if (select.options.length > 0 && select.options[0].text !== "No hay horarios disponibles") {
            select.disabled = false;
            select.value = select.options[0].value;

            // Si hay una siguiente tanda, actualizar sus opciones también
            if (selects[index + 1]) {
              updateNextTandaOptions(select.value, selects[index + 1], mensajesPorTanda);
            }
          }
        }
      }
    });
  }

  // Actualizar opciones de horarios basado en la selección previa
  function updateNextTandaOptions(selectedTime, nextSelect, messagesPerTanda) {
    if (!nextSelect) return;

    const wasMinimumTime = nextSelect.value === nextSelect.options[0]?.value;
    const [selectedHours, selectedMinutes] = selectedTime.split(':').map(Number);
    const tandaDuration = calculateTandaDuration(messagesPerTanda);

    let numTandas = parseInt(document.getElementById("numTandas").value);
    let minNextHour = selectedHours + tandaDuration + MIN_HOURS_BETWEEN_TANDAS;
    if (numTandas === 4) {
      minNextHour = selectedHours + tandaDuration + 2;
    }
    
    minNextHour += selectedMinutes / 60;
    minNextHour = Math.ceil(minNextHour * 2) / 2;

    debugConsoleLog("MINIMUM TIME FOR NEXT HOUR " + minNextHour);

    let options;

    if (minNextHour >= 23 || minNextHour < 0) {
      // Si pasa de las 23:00 o es negativo, usar horas de madrugada
      const madrugadaHour = (minNextHour % 24 + 24) % 24; // Asegura número positivo
      const startHour = Math.floor(madrugadaHour);

      // Si la hora de madrugada es después de las 6, empezar desde 0
      if (startHour > 6) {
        options = generateTimeOptions(0, 6);
      } else {
        options = generateTimeOptions(startHour, 6);
      }

      nextSelect.innerHTML = options.map(time =>
        `<option value="${time}">${time} (madrugada)</option>`
      ).join('');
    } else {
      // Para el resto del día
      options = generateTimeOptions(Math.floor(minNextHour), 23);
      nextSelect.innerHTML = options.map(time =>
        `<option value="${time}">${time}</option>`
      ).join('');
    }

    nextSelect.disabled = false;

    if (options && options.length > 0) {
      if (wasMinimumTime || !nextSelect.value) {
        nextSelect.value = options[0];
        const tandaIndex = Array.from(document.querySelectorAll('.horario-select')).indexOf(nextSelect);
        selectedTandaTimes[`tanda${tandaIndex + 1}`] = options[0];
      }
    }
  }

  // Actualizar mensajes por tanda
  function updateMensajesPorTanda() {
    const totalMensajes = parseInt(messageLimitInput.value);
    const numTandas = parseInt(numTandasSelect.value);
    
    // Calcular mensajes base por tanda y el residuo
    const mensajesBasePorTanda = Math.floor(totalMensajes / numTandas);
    const mensajesExtra = totalMensajes % numTandas;

    // Actualizar el texto de mensajes por tanda
    document.querySelectorAll('.mensajes-por-tanda').forEach((span, index) => {
        // La primera tanda recibe los mensajes extra
        if (index === 0) {
            span.textContent = mensajesBasePorTanda + mensajesExtra;
        } else {
            span.textContent = mensajesBasePorTanda;
        }
    });

    // Recalcular todos los horarios cuando cambia la cantidad de mensajes
    recalculateAllTandas();
  } 

  function updateTandasBasedOnMessageLimit(messageLimit) {
    const numTandasSelect = document.getElementById('numTandas');
    let tandasValue;
  
    if (messageLimit <= 20) {
      tandasValue = "1";
    } else if (messageLimit <= 40) {
      tandasValue = "2";
    } else if (messageLimit <= 80) {
      tandasValue = "3";
    } else {
      tandasValue = "4";  // Agregar opción para 4 tandas
    }
  
    // Actualizar el select de tandas
    if (numTandasSelect.value !== tandasValue) {
      numTandasSelect.value = tandasValue;
      numTandasSelect.dispatchEvent(new Event('change'));
    }
  }

  //messageLimitInput.addEventListener('input', updateMensajesPorTanda);
  document.getElementById("messageLimitPopup").addEventListener("input", function () {
    // Mantener la funcionalidad original
    document.getElementById("messageLimitLabelPopup").innerText = this.value;
    let messageLimitOriginal = document.getElementById("messageLimit");
    messageLimitOriginal.value = this.value;
    messageLimitOriginal.dispatchEvent(new Event('input'));

    // Agregar la nueva funcionalidad de tandas
    const totalMensajes = parseInt(this.value);
    const numTandas = parseInt(document.getElementById('numTandas').value);
    const mensajesPorTanda = Math.floor(totalMensajes / numTandas);

    // Actualizar el texto de mensajes por tanda
    document.querySelectorAll('.mensajes-por-tanda').forEach(span => {
      span.textContent = mensajesPorTanda;
    });

    document.getElementById('sentMessagesTableBody').querySelectorAll('tr[style="display: none;"]').forEach(row => { row.remove(); });

    // Recalcular todos los horarios
    recalculateAllTandas();

    updateTandasBasedOnMessageLimit(messageLimit);
  });

  numTandasSelect.addEventListener('change', updateTandasVisibility);

  // Mostrar/ocultar tandas según selección
  function updateTandasVisibility() {
    const numTandas = parseInt(numTandasSelect.value);
    document.querySelectorAll('.tanda-horario').forEach((tanda, index) => {
      const isVisible = index < numTandas;
      tanda.style.display = isVisible ? 'block' : 'none';

      // Solo resetear valores de tandas ocultas
      if (!isVisible) {
        selectedTandaTimes[`tanda${index + 1}`] = null;
      }
    });

    updateMensajesPorTanda();
    initializeFirstTanda();
    initializeTandaListeners();

    // Forzar la actualización de todas las tandas visibles
    const selects = document.querySelectorAll('.horario-select');
    selects.forEach((select, index) => {
      if (index < numTandas && select.options.length > 0) {
        if (!selectedTandaTimes[`tanda${index + 1}`]) {
          select.value = select.options[0].value;
          selectedTandaTimes[`tanda${index + 1}`] = select.options[0].value;
        }
      }
    });
  }

  // Función para actualizar la hora actual en el primer select
  function updateFirstTandaTime() {
    if (notUpdateTandaFirstTime) {
      return;
    }

    const firstSelect = document.querySelector('.horario-select');
    if (!firstSelect) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    firstSelect.innerHTML = `<option value="${currentTime}">${currentTime}</option>`;
    firstSelect.disabled = true;
    firstSelect.style.opacity = '0.7';

    // Actualizar el tiempo guardado
    selectedTandaTimes.tanda1 = currentTime;

    // Actualizar las opciones de la siguiente tanda si es necesario
    const secondSelect = document.querySelectorAll('.horario-select')[1];
    if (secondSelect) {
      const mensajesPorTanda = Math.floor(parseInt(messageLimitInput.value) / parseInt(numTandasSelect.value));
      updateNextTandaOptions(currentTime, secondSelect, mensajesPorTanda);
    }
  }

  // Función para actualizar todas las tandas
  function updateAllTandaTimes() {
    const selects = document.querySelectorAll('.horario-select');
    const numTandas = parseInt(document.getElementById('numTandas').value);
    const mensajesPorTanda = Math.floor(parseInt(messageLimitInput.value) / numTandas);

    // Actualizar primera tanda con hora actual
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;

    // Actualizar primera tanda
    if (selects[0]) {
      selects[0].innerHTML = `<option value="${currentTime}">${currentTime}</option>`;
      selects[0].disabled = true;
      selects[0].style.opacity = '0.7';
      selectedTandaTimes.tanda1 = currentTime;
    }

    // Actualizar tandas subsecuentes
    for (let i = 1; i < selects.length; i++) {
      const previousSelect = selects[i - 1];
      const currentSelect = selects[i];

      // Guardar el valor actual antes de actualizar
      const currentValue = currentSelect.value;

      // Actualizar opciones basadas en la tanda anterior
      updateNextTandaOptions(previousSelect.value, currentSelect, mensajesPorTanda);

      // Si el valor anterior era el mínimo disponible, seleccionar el nuevo mínimo
      if (currentValue === currentSelect.options[0]?.value) {
        currentSelect.value = currentSelect.options[0]?.value || '';
        selectedTandaTimes[`tanda${i + 1}`] = currentSelect.value;

        if (DEBUG) console.error(`[HOWER] - Tanda ${i + 1} actualizada al nuevo mínimo: ${currentSelect.value}`);
      }
    }
  }

  function initializeFirstTanda() {
    // Hacer la primera actualización
    // updateFirstTandaTime();
    updateAllTandaTimes();
    // Actualizar cada minuto
    updateInterval = setInterval(updateFirstTandaTime, 60000); // 60000 ms = 1 minuto
  }



  // Inicializar listeners para tandas subsecuentes
  function initializeTandaListeners() {
    const selects = document.querySelectorAll('.horario-select');
    selects.forEach((select, index) => {
      select.addEventListener('change', function () {
        selectedTandaTimes[`tanda${index + 1}`] = this.value;
        console.log("Tiempos guardados:", selectedTandaTimes);

        if (index < selects.length - 1) {
          const mensajesPorTanda = Math.floor(parseInt(messageLimitInput.value) / parseInt(numTandasSelect.value));
          updateNextTandaOptions(this.value, selects[index + 1], mensajesPorTanda);
        }
      });

      // Asegurarse de que haya un valor seleccionado inicialmente
      if (select.options.length > 0 && !selectedTandaTimes[`tanda${index + 1}`]) {
        select.value = select.options[0].value;
        selectedTandaTimes[`tanda${index + 1}`] = select.options[0].value;
      }
    });
  }

  document.getElementById("messageLimit").addEventListener("input", function () {
    // Mantener la funcionalidad original
    localStorage.setItem("messageLimit", this.value);
    messageLimit = this.value;
    document.getElementById("messageLimitPopup").value = this.value;
    document.getElementById("messageLimitLabel").innerText = messageLimit;
    document.getElementById("messageLimitLabelPopup").innerText = this.value;

    // Agregar la funcionalidad de tandas
    const totalMensajes = parseInt(this.value);
    const numTandas = parseInt(document.getElementById('numTandas').value);
    const mensajesPorTanda = Math.floor(totalMensajes / numTandas);

    // Actualizar el texto de mensajes por tanda
    document.querySelectorAll('.mensajes-por-tanda').forEach(span => {
      span.textContent = mensajesPorTanda;
    });

    if (DEBUG) console.error("[HOWER] - recalculating tandas........: " + messageLimit);

    // Recalcular todos los horarios
    if (DEBUG) console.error("[HOWER] - ENTRANDO A SETEAR LOS TIEMPOS DE TANDAS");
    updateMensajesPorTanda();

    // eliminar las filas de la tabla de mensajes enviados que tengan display = none
    // ... existing code ...
    document.getElementById('sentMessagesTableBody').querySelectorAll('tr[style="display: none;"]').forEach(row => {
      row.remove();
    });

    updateTandasBasedOnMessageLimit(messageLimit);
    // Actualizar número de tandas basado en el límite de mensajes
  });


  // Event listeners
  messageLimitInput.addEventListener('input', updateMensajesPorTanda);
  numTandasSelect.addEventListener('change', updateTandasVisibility);

  // Inicialización
  updateTandasVisibility();


  document.getElementById('prevButtonMessage').addEventListener('click', () => moveCarouselMessage(-1));
  document.getElementById('nextButtonMessage').addEventListener('click', () => moveCarouselMessage(1));


});

function moveCarouselMessage(direction) {
  // Calcular la nueva posición
  const newPosition = currentSlideMessage + direction;

  // Verificar límites
  if (newPosition >= 0 && newPosition < totalSlidesMessage) {
    currentSlideMessage = newPosition;
    updateCarouselPositionMessage();
    updateSlideCounterMessage();
  }
}



function updateCarouselPositionMessage() {
  const wrapper = document.querySelector('.carousel-wrapper');
  const slides = wrapper.querySelectorAll('.carousel-slide');

  if (wrapper) {
    const slideWidth = 100 / totalSlidesMessage;
    wrapper.style.transform = `translateX(-${currentSlideMessage * slideWidth}%)`;

    // Actualizar visibilidad de los slides
    slides.forEach((slide, index) => {
      slide.style.visibility = index === currentSlideMessage ? 'visible' : 'hidden';
    });
  }
}

function updateSlideCounterMessage() {
  const counter = document.getElementById('slideCounterMessage');
  if (counter) {
    counter.textContent = `${currentSlideMessage + 1}/${totalSlidesMessage}`;
  }
}


// end of carousel messages code


function goToMessageIndex(targetIndex) {
  while (currentMessageIndex < targetIndex) {
    document.getElementById("nextMessage").click();
  }
}



document.getElementById("closePopupPostsSearcher").addEventListener("click", function () {
  document.getElementById("popupOverlayPostsSearcher").style.display = "none";
  document.getElementById("welcomePopupPostsSearcher").style.display = "none";
});



document.getElementById("showSentMessagesButton").addEventListener("click", function () {
  document.getElementById("popupOverlayTableMessagesSent").style.display = "block";
  document.getElementById("welcomePopupTableMessagesSent").style.display = "block";
});

document.addEventListener("DOMContentLoaded", function () {
  // Obtener todas las plantillas
  // startCarousel();

  const searchLimiterPerplexityAI = new SearchLimiterPerplexityAI(10); // 10 búsquedas por día
  const searchButton = document.getElementById('searchButton');
    const searchInput = document.getElementById('nicheSearch');
    const loadingIndicator = document.getElementById('loadingIndicator');
    const searchText = document.querySelector('.gradient-text');
    const suggestionButtons = document.querySelectorAll('.suggestion-bubble');


    async function performSearch(query) {
      const limitCheck = searchLimiterPerplexityAI.canSearch();
      if (!limitCheck.allowed) {
          alert(limitCheck.message);
          return;
      }

      try {
          loadingIndicator.style.display = 'block';
          searchText.classList.add('loading');
          const results = await searchInstagramAccounts(query);
          const parsedAccounts = parseResults(results);
          displayResults(parsedAccounts);
      } catch (error) {
          console.error('Error:', error);
          alert('Hubo un error al buscar las cuentas. Por favor, intenta de nuevo.');
      } finally {
          loadingIndicator.style.display = 'none';
          searchText.classList.remove('loading');
          // Actualizar el indicador después de cada búsqueda
          searchLimiterPerplexityAI.updateIndicator();
      }
    }

    setInterval(() => {
      searchLimiterPerplexityAI.updateIndicator();
  }, 60000); // Actualizar cada minuto

  searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query) {
            performSearch(query);
        }
    });

  // También aplicar el límite a los clicks en las sugerencias
  suggestionButtons.forEach(button => {
    button.addEventListener('click', function() {
        const nicheName = this.textContent.split(' ').slice(1).join(' ');
        const promptText = nicheName;
        
        nicheSearch.value = promptText;
          nicheSearch.focus();
      });
  });

    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const query = searchInput.value.trim();
            if (query) {
                performSearch(query);
            }
        }
    });

    



  initializeTooltips();

  const genderRadios = document.querySelectorAll('input[name="gender"]');
  genderRadios.forEach(radio => {
    radio.addEventListener('change', async function () {
      if (this.checked) {
        console.log(`Selected gender: ${this.value}`);
        selectedGender = this.value;


        await new Promise(resolve => setTimeout(resolve, 300));

        setSlideActive('carousel__slide8');
        // Aquí puedes manejar la lógica cuando se selecciona un género
      }
    });
  });




  const slider = document.getElementById('prospectLevelSlider');
    const labels = document.querySelectorAll('.level-label');
    const descriptions = document.querySelectorAll('.level-desc');

    function updateLabels(value) {
      selectedProspectFilterLevel = parseInt(value);
        // labels.forEach((label, index) => {
        //     label.classList.toggle('active', index + 1 === parseInt(value));
        // });
        descriptions.forEach((desc, index) => {
            desc.classList.toggle('active', index + 1 === parseInt(value));
        });
    }

    slider.addEventListener('input', function() {
      // Guardar en localStorage
      localStorage.setItem('savedLevelForContactingProspects', this.value);
      // Mantener la funcionalidad existente
      updateLabels(this.value);
    });

    // Inicializar con el valor por defecto
    updateLabels(slider.value);

  



  // Initialize styles on page load
  updateRadioStyles();
  document.querySelectorAll('input[type="radio"]').forEach(radio => {
    radio.addEventListener('change', updateRadioStyles);
  });


  const templates = document.querySelectorAll(".template");
  setSlideActive('carousel__slide1');

  templates.forEach((template) => {
    template.addEventListener("click", function (e) {
      e.preventDefault();
      let message = this.querySelector("small i").innerText;

      // replace the messages here
      if (document.getElementById("emailPrepared").value && !document.getElementById("emailPrepared").value.includes("www.instagram.com")) {
        let valueUsername = document.getElementById("emailPrepared").value;
        // replace the text 'cuentadelapublicacion' from the text inputs and messages
        message = message.replaceAll("cuentadelapublicacion", valueUsername);
      }

      // Obtener el textarea basado en currentMessageIndex
      const wrapper = document.getElementById('textareaWrapper');
      const textareas = wrapper.querySelectorAll('textarea');
      const currentTextarea = textareas[currentMessageIndex];

      if (currentTextarea) {
        console.log("Textarea encontrado en índice:", currentMessageIndex);
        // Insertar el texto en la posición del cursor o al final si no hay cursor
        const cursorPosition = currentTextarea.selectionStart || currentTextarea.value.length;
        const textBeforeCursor = currentTextarea.value.substring(0, cursorPosition);
        const textAfterCursor = currentTextarea.value.substring(cursorPosition);
        currentTextarea.value = textBeforeCursor + (message.trim().replaceAll(/\[NAME_IDENTIFIER\]/g, '[NOMBRE]')) + textAfterCursor;

        updateMessagePreparedUI();

        document.getElementById("welcomePopupSendersTemplates").style.display = "none";
        document.getElementById("popupOverlaySendersTemplates").style.display = "none";

        enableContinueMessage();
        currentTextarea.dispatchEvent(new Event('input'));

        alert("¡Plantilla insertada!");
      } else {
        if (DEBUG) console.error("No se encontró el textarea en el índice:", currentMessageIndex);
      }
    });
  });


  if (localStorage.getItem("username") && localStorage.getItem("token")) {
    document.getElementById("username").value = localStorage.getItem("username");
    document.getElementById("token").value = localStorage.getItem("token")
  }
});

let followerMessages = [
  // "Hi [NOMBRE]! Thanks for following me 😊 hey just curious... What interested you about my profile?",
  // "Welcome [NOMBRE]! 👋 I'm glad you were interested in my content",
  // "Thanks for the follow [NOMBRE]! 🌟 Where are you following me from?"
  "¡Hola [NOMBRE]! Gracias por seguirme 😊 oye curiosidad... ¿Qué te interesó de mi perfil?",
  "¡Bienvenido/a [NOMBRE]! 👋 Me alegra que te haya interesado mi contenido",
  "¡Gracias por el follow [NOMBRE]! 🌟 ¿De dónde me sigues?"
];

let listMessagesStories = [
  "Hola [NOMBRE], vi algo en tu publicación reciente que me dio una idea... ¿Te gustaría que la compartiera?",
  "Hey [NOMBRE], tu reel reciente me hizo pensar... Tengo una idea rápida, ¿te gustaría escucharla?",
  "¡Qué tal [NOMBRE]! oye! me pareció tu perfil muy interesante!. De hecho, me hizo pensar en algo que creo que te gustaría. ¿Hablamos?",
  "Hola [NOMBRE], noté algo en tu historia. Me dio una perspectiva única. ¿te lo digo rápido?",
  "¡Ey [NOMBRE]! Hubo algo en tu última publicación que resonó conmigo. Tuve una idea que creo que podría ser útil para ti... ¿qué te parece? ¿te la cuento?"
]


function toggleMessageButton() {
  let showMessagesBtn = document.getElementById('showFollowerMessagesBtn');
  let modal = document.getElementById('followerMessagesModal');
  const checkbox = document.getElementById('sendMessageToNewFollowersCheckbox');

  console.log('Toggle function called');
  console.log('Checkbox state:', checkbox.checked);
  
  if (checkbox.checked) {
    shouldSendMessageToNewFollowers = true;
      showMessagesBtn.style.display = 'block';
  } else {
    shouldSendMessageToNewFollowers = false;
      showMessagesBtn.style.display = 'none';
      modal.style.display = 'none';
  }
}


document.getElementById('sendMessageToNewFollowersCheckbox').addEventListener('click', function(e) {
  console.log('Checkbox clicked');
  if (document.getElementById('sendMessageToNewFollowersCheckbox').checked) {
    localStorage.setItem('shouldSendMessageToNewFollowers', 'true');
  } else {
    localStorage.setItem('shouldSendMessageToNewFollowers', 'false');
  }
  toggleMessageButton();
});

document.getElementById('sendMessageToNewFollowersCheckbox').addEventListener('change', function(e) {
  console.log('Checkbox clicked');
  if (document.getElementById('sendMessageToNewFollowersCheckbox').checked) {
    localStorage.setItem('shouldSendMessageToNewFollowers', 'true');
  } else {
    localStorage.setItem('shouldSendMessageToNewFollowers', 'false');
  }
  toggleMessageButton();
});


function renderStoriesMessages2() {
  const storiesMessagesList = document.getElementById('storiesMessagesList2');
  storiesMessagesList.innerHTML = '';
  
  // Agregar estilos de scroll al contenedor
  storiesMessagesList.style.cssText = `
    max-height: 400px;
    overflow-y: auto;
    padding: 15px;
    /* Estilo del scrollbar */
    scrollbar-width: thin;
    scrollbar-color: #7a60ff #f0f0f0;
  `;
  
  // Obtener mensajes de stories del localStorage o usar array por defecto
  let storiesMessages = JSON.parse(localStorage.getItem('storiesMessages')) || listMessagesStories;
    
  // Renderizar mensajes existentes
  storiesMessages.forEach((message, index) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'stories-message-item';
    messageDiv.style.cssText = `
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 15px;
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    `;
    
    messageDiv.innerHTML = `
      <div style="display: flex; flex-direction: column; width: 100%;">
        <textarea class="stories-message-textarea" style="
          width: 100%;
          padding: 10px;
          margin: 5px 0;
          border: 1px solid #ddd;
          border-radius: 6px;
          min-height: 80px;
          resize: vertical;
          font-size: 14px;
          line-height: 1.5;
          background: white;">${message}</textarea>
        <button class="insert-name-btn" style="
          background-color: #7a60ff;
          color: white;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          margin-top: 8px;
          align-self: flex-start;
          transition: background-color 0.2s;">
          Introducir nombre
        </button>
      </div>
      <button class="stories-delete-btn" data-index="${index}" style="
        min-width: 32px;
        height: 32px;
        background: #ff4d4f;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 5px;
        transition: background-color 0.2s;">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 4h12m-1 0l-.867 10.4A2 2 0 0110.138 16H5.862a2 2 0 01-1.995-1.6L3 4h10M6 4V2a1 1 0 011-1h2a1 1 0 011 1v2H6z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    `;
    storiesMessagesList.appendChild(messageDiv);

    // Agregar hover effects
    const deleteBtn = messageDiv.querySelector('.stories-delete-btn');
    deleteBtn.addEventListener('mouseover', () => deleteBtn.style.backgroundColor = '#ff7875');
    deleteBtn.addEventListener('mouseout', () => deleteBtn.style.backgroundColor = '#ff4d4f');

    const insertNameBtn = messageDiv.querySelector('.insert-name-btn');
    insertNameBtn.addEventListener('mouseover', () => insertNameBtn.style.backgroundColor = '#6346ff');
    insertNameBtn.addEventListener('mouseout', () => insertNameBtn.style.backgroundColor = '#7a60ff');

    // Agregar listener para guardar cambios en el texto
    const textarea = messageDiv.querySelector('.stories-message-textarea');
    textarea.addEventListener('input', () => {
      storiesMessages[index] = textarea.value;
      localStorage.setItem('storiesMessages', JSON.stringify(storiesMessages));
    });

    // Agregar listener para el botón de insertar nombre
    insertNameBtn.addEventListener('click', () => {
      const cursorPos = textarea.selectionStart;
      const textBefore = textarea.value.substring(0, cursorPos);
      const textAfter = textarea.value.substring(textarea.selectionEnd);
      
      textarea.value = textBefore + '[NOMBRE]' + textAfter;
      storiesMessages[index] = textarea.value;
      localStorage.setItem('storiesMessages', JSON.stringify(storiesMessages));
      
      const newCursorPos = cursorPos + '[NOMBRE]'.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  });

  // Agregar botón de "Agregar mensaje" si hay menos de 5 mensajes
  if (storiesMessages.length < 100) {
    const addButtonDiv = document.createElement('div');
    addButtonDiv.className = 'stories-message-item add-message-btn';
    addButtonDiv.style.textAlign = 'center';
    addButtonDiv.innerHTML = `
      <button class="add-message-button" style="
        background-color: #4CAF50;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        width: 100%;
        margin-top: 10px;
        transition: background-color 0.2s;">
        + Agregar mensaje
      </button>
    `;
    storiesMessagesList.appendChild(addButtonDiv);

    const addButton = addButtonDiv.querySelector('.add-message-button');
    addButton.addEventListener('mouseover', () => addButton.style.backgroundColor = '#45a049');
    addButton.addEventListener('mouseout', () => addButton.style.backgroundColor = '#4CAF50');

    addButton.addEventListener('click', () => {
      storiesMessages.push('Nuevo mensaje'); // Agregar un texto por defecto en lugar de string vacío
      localStorage.setItem('storiesMessages', JSON.stringify(storiesMessages));
      renderStoriesMessages2(); // Cambiar a renderStoriesMessages2
    });
  }

  // Agregar listener para los botones de eliminar
  storiesMessagesList.addEventListener('click', (e) => {
    if (e.target.closest('.stories-delete-btn')) {
      if (storiesMessages.length <= 3) { 
        return; // No eliminar si hay 3 o menos mensajes
      }
      const index = parseInt(e.target.closest('.stories-delete-btn').dataset.index);
      storiesMessages.splice(index, 1);
      localStorage.setItem('storiesMessages', JSON.stringify(storiesMessages));
      renderStoriesMessages2();
    }
  });
}


function renderStoriesMessages() {
  const storiesMessagesList = document.getElementById('storiesMessagesList');
  storiesMessagesList.innerHTML = '';
  
  // Agregar estilos de scroll al contenedor
  storiesMessagesList.style.cssText = `
    max-height: 400px;
    overflow-y: auto;
    padding: 15px;
    /* Estilo del scrollbar */
    scrollbar-width: thin;
    scrollbar-color: #7a60ff #f0f0f0;
  `;
  
  // Obtener mensajes de stories del localStorage o usar array por defecto
  let storiesMessages = JSON.parse(localStorage.getItem('storiesMessages')) || listMessagesStories;
    
  // Renderizar mensajes existentes
  storiesMessages.forEach((message, index) => {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'stories-message-item';
    messageDiv.style.cssText = `
      display: flex;
      align-items: flex-start;
      gap: 10px;
      margin-bottom: 15px;
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    `;
    
    messageDiv.innerHTML = `
      <div style="display: flex; flex-direction: column; width: 100%;">
        <textarea class="stories-message-textarea" style="
          width: 100%;
          padding: 10px;
          margin: 5px 0;
          border: 1px solid #ddd;
          border-radius: 6px;
          min-height: 80px;
          resize: vertical;
          font-size: 14px;
          line-height: 1.5;
          background: white;">${message}</textarea>
        <button class="insert-name-btn" style="
          background-color: #7a60ff;
          color: white;
          padding: 6px 12px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 13px;
          margin-top: 8px;
          align-self: flex-start;
          transition: background-color 0.2s;">
          Introducir nombre
        </button>
      </div>
      <button class="stories-delete-btn" data-index="${index}" style="
        min-width: 32px;
        height: 32px;
        background: #ff4d4f;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-top: 5px;
        transition: background-color 0.2s;">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 4h12m-1 0l-.867 10.4A2 2 0 0110.138 16H5.862a2 2 0 01-1.995-1.6L3 4h10M6 4V2a1 1 0 011-1h2a1 1 0 011 1v2H6z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    `;
    storiesMessagesList.appendChild(messageDiv);

    // Agregar hover effects
    const deleteBtn = messageDiv.querySelector('.stories-delete-btn');
    deleteBtn.addEventListener('mouseover', () => deleteBtn.style.backgroundColor = '#ff7875');
    deleteBtn.addEventListener('mouseout', () => deleteBtn.style.backgroundColor = '#ff4d4f');

    const insertNameBtn = messageDiv.querySelector('.insert-name-btn');
    insertNameBtn.addEventListener('mouseover', () => insertNameBtn.style.backgroundColor = '#6346ff');
    insertNameBtn.addEventListener('mouseout', () => insertNameBtn.style.backgroundColor = '#7a60ff');

    // Agregar listener para guardar cambios en el texto
    const textarea = messageDiv.querySelector('.stories-message-textarea');
    textarea.addEventListener('input', () => {
      storiesMessages[index] = textarea.value;
      localStorage.setItem('storiesMessages', JSON.stringify(storiesMessages));
    });

    // Agregar listener para el botón de insertar nombre
    insertNameBtn.addEventListener('click', () => {
      const cursorPos = textarea.selectionStart;
      const textBefore = textarea.value.substring(0, cursorPos);
      const textAfter = textarea.value.substring(textarea.selectionEnd);
      
      textarea.value = textBefore + '[NOMBRE]' + textAfter;
      storiesMessages[index] = textarea.value;
      localStorage.setItem('storiesMessages', JSON.stringify(storiesMessages));
      
      const newCursorPos = cursorPos + '[NOMBRE]'.length;
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  });

  // Agregar botón de "Agregar mensaje" si hay menos de 5 mensajes
  if (storiesMessages.length < 100) {
    const addButtonDiv = document.createElement('div');
    addButtonDiv.className = 'stories-message-item add-message-btn';
    addButtonDiv.style.textAlign = 'center';
    addButtonDiv.innerHTML = `
      <button class="add-message-button" style="
        background-color: #4CAF50;
        color: white;
        padding: 10px 20px;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        width: 100%;
        margin-top: 10px;
        transition: background-color 0.2s;">
        + Agregar mensaje
      </button>
    `;
    storiesMessagesList.appendChild(addButtonDiv);

    const addButton = addButtonDiv.querySelector('.add-message-button');
    addButton.addEventListener('mouseover', () => addButton.style.backgroundColor = '#45a049');
    addButton.addEventListener('mouseout', () => addButton.style.backgroundColor = '#4CAF50');

    addButton.addEventListener('click', () => {
      storiesMessages.push('');
      localStorage.setItem('storiesMessages', JSON.stringify(storiesMessages));
      renderStoriesMessages();
    });
  }

  // Agregar listener para los botones de eliminar
  storiesMessagesList.addEventListener('click', (e) => {
    if (e.target.closest('.stories-delete-btn')) {
      if (storiesMessages.length <= 3) { 
        return; // No eliminar si hay 3 o menos mensajes
      }
      const index = e.target.closest('.stories-delete-btn').dataset.index;
      storiesMessages.splice(index, 1);
      localStorage.setItem('storiesMessages', JSON.stringify(storiesMessages));
      renderStoriesMessages();
    }
  });
}



document.addEventListener('DOMContentLoaded', function() {
  // Debug inicial
  console.log("DOM Content Loaded");
    
  const checkbox = document.getElementById('sendMessageToNewFollowersCheckbox');
  const showMessagesBtn = document.getElementById('showFollowerMessagesBtn');
  const modal = document.getElementById('followerMessagesModal');
  const closeBtn = document.querySelector('.follower-modal-close');
  const messagesList = document.getElementById('followerMessagesList');

  // Verificar que los elementos existen
  console.log('Checkbox exists:', !!checkbox);
  console.log('Button exists:', !!showMessagesBtn);
  console.log('Modal exists:', !!modal);
  
  if (!checkbox || !showMessagesBtn || !modal) {
      console.error('Some elements are missing!');
      return;
  }

    
  showMessagesBtn.addEventListener('click', () => {
    modal.style.display = 'block';
    renderMessages();
  });

  // Inicialización
  console.log('Initial checkbox state:', checkbox.checked);
  toggleMessageButton();


  // Intentar obtener mensajes del localStorage
  const savedMessages = localStorage.getItem('followerMessages');

  if (savedMessages) {
      // Si hay mensajes guardados, usarlos
      followerMessages = JSON.parse(savedMessages);
  } else {
      // Si no hay mensajes guardados, usar los predefinidos
      followerMessages = [
          "¡Hola! Vi que me seguiste y quiero agradecerte. ¿Qué te parece mi contenido?",
          "¡Gracias por seguirme! Me encantaría saber qué te pareció mi perfil 😊",
          "¡Hey! Gracias por el follow. ¿Qué tipo de contenido te gustaría ver más?"
          // "Hi! I saw you followed me and I want to thank you. What do you think about my content?",
          // "Thanks for following me! I'd love to know what you thought about my profile 😊",
          // "Hey! Thanks for the follow. What kind of content would you like to see more of?"
      ];
      // Guardar los mensajes predefinidos en localStorage
      localStorage.setItem('followerMessages', JSON.stringify(followerMessages));
  }
   // obtener si la persona queria configurar el envío de mensajes previos!
   const shouldSendMessageToNewFollowersLocalStorage = localStorage.getItem('shouldSendMessageToNewFollowers');
   const savedLevel = localStorage.getItem('savedLevelForContactingProspects') || '1';
   if (shouldSendMessageToNewFollowersLocalStorage) {
    shouldSendMessageToNewFollowers = shouldSendMessageToNewFollowersLocalStorage === 'true';
    // activate checkbox
    document.getElementById('sendMessageToNewFollowersCheckbox').checked = shouldSendMessageToNewFollowers;
    toggleMessageButton();
   }

   const savedShouldFollowProspects = localStorage.getItem("followFollowersChecked");

   if (savedShouldFollowProspects !== null) {
    const isChecked = savedShouldFollowProspects === "true";
    
    // Set both checkboxes to the stored value
    document.getElementById("followFollowersCheckboxPopup").checked = isChecked;
    const checkbox = document.getElementById("followFollowersCheckbox");
    checkbox.checked = isChecked;
    
    // Optional: Dispatch event if needed
    checkbox.dispatchEvent(new Event('change'));
  }

  const savedLimit = localStorage.getItem("messageLimit");
  if (savedLimit !== null) {
    const limitInput = document.getElementById("messageLimit");
    const limitPopup = document.getElementById("messageLimitPopup");

    limitInput.value = savedLimit;
    limitPopup.value = savedLimit;

    // Simular el evento input para que se actualicen los elementos dependientes
    limitInput.dispatchEvent(new Event("input"));
  }

  const savedWaitTime = localStorage.getItem("waitTime");
  if (savedWaitTime !== null) {
    const waitInput = document.getElementById("waitTime");
    waitInput.value = savedWaitTime;

    // Dispara el evento para que se actualicen los elementos dependientes
    waitInput.dispatchEvent(new Event("input"));
  }
    
  // Obtener elementos del DOM
  const sliderLevel = document.getElementById('prospectLevelSlider');
  const levelLabels = document.querySelectorAll('.level-label');
  const levelDescs = document.querySelectorAll('.level-desc');
  
  // Establecer el valor del slider
  sliderLevel.value = savedLevel;
  
  // // Actualizar las clases active
  // levelLabels.forEach((label, index) => {
  //     label.classList.remove('active');
  //     if (index === parseInt(savedLevel) - 1) {
  //         label.classList.add('active');
  //     }
  // });
  
  levelDescs.forEach((desc, index) => {
      desc.classList.remove('active');
      if (index === parseInt(savedLevel) - 1) {
          desc.classList.add('active');
      }
  });


   // insert here other elements from local storage!

    // Obtener el checkbox
    const checkbox2 = document.getElementById('sendMessageStoriesCheckbox'); // Asegúrate de tener un selector más específico
    const storiesCheckbox = document.getElementById('sendMessageStoriesCheckboxPopup');
    const configureButton = document.getElementById('configureStoriesMessages');
    
    // Recuperar el valor guardado (si no existe, por defecto será true)
    const savedValue = localStorage.getItem('notSendMessageStories');
    notSendMessageStories = savedValue === null ? true : savedValue === 'true';

    if (!notSendMessageStories) {
      showModalMessagesStories();

    } else {
      hideModalMessagesStories();
    }

    renderStoriesMessages();
    
    // Establecer el estado del checkbox (nota la inversión porque notSendMessageStories es lo opuesto al checked)
    checkbox2.checked = !notSendMessageStories;
    storiesCheckbox.checked = !notSendMessageStories;




    storiesCheckbox.addEventListener('change', function() {
      // Sincronizar el otro checkbox
      const checkboxTwo = document.getElementById('sendMessageStoriesCheckbox');
      checkboxTwo.checked = this.checked;
      checkboxTwo.dispatchEvent(new Event('change'));
  
    });

    // Efecto hover para el botón
    configureButton.addEventListener('mouseover', function() {
        this.style.backgroundColor = '#6346ff';
    });

    configureButton.addEventListener('mouseout', function() {
        this.style.backgroundColor = '#7a60ff';
    });

    configureButton.addEventListener('click', function () {
      showModalMessagesStoriesAndRender2();
    });
   






function renderMessages() {
  messagesList.innerHTML = '';
    
    // Renderizar mensajes existentes
    followerMessages.forEach((message, index) => {
        const messageDiv = document.createElement('div');
        messageDiv.className = 'follower-message-item';
        messageDiv.innerHTML = `
            <div style="display: flex; flex-direction: column; width: 100%;">
                <textarea class="follower-message-textarea">${message}</textarea>
                <button class="insert-name-btn" style="
                    background-color: #007bff;
                    color: white;
                    padding: 4px 8px;
                    border: none;
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 12px;
                    margin-top: 5px;
                    align-self: flex-start;">
                    Introducir nombre
                </button>
            </div>
            <button class="follower-delete-btn" data-index="${index}">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M2 4h12m-1 0l-.867 10.4A2 2 0 0110.138 16H5.862a2 2 0 01-1.995-1.6L3 4h10M6 4V2a1 1 0 011-1h2a1 1 0 011 1v2H6z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            </button>
        `;
        messagesList.appendChild(messageDiv);

        // Agregar listener para guardar cambios en el texto
        const textarea = messageDiv.querySelector('.follower-message-textarea');
        textarea.addEventListener('input', () => {
            followerMessages[index] = textarea.value;
            localStorage.setItem('followerMessages', JSON.stringify(followerMessages));
        });

        // Agregar listener para el botón de insertar nombre
        const insertNameBtn = messageDiv.querySelector('.insert-name-btn');
        insertNameBtn.addEventListener('click', () => {
            const cursorPos = textarea.selectionStart;
            const textBefore = textarea.value.substring(0, cursorPos);
            const textAfter = textarea.value.substring(textarea.selectionEnd);
            
            textarea.value = textBefore + '[NOMBRE]' + textAfter;
            followerMessages[index] = textarea.value;
            localStorage.setItem('followerMessages', JSON.stringify(followerMessages));
            
            // Colocar el cursor después del [NOMBRE] insertado
            const newCursorPos = cursorPos + '[NOMBRE]'.length;
            textarea.focus();
            textarea.setSelectionRange(newCursorPos, newCursorPos);
        });
    });

  // Agregar botón de "Agregar mensaje" si hay menos de 3 mensajes
  if (followerMessages.length < 3) {
      const addButtonDiv = document.createElement('div');
      addButtonDiv.className = 'follower-message-item add-message-btn';
      addButtonDiv.innerHTML = `
          <button class="add-message-button" style="
              background-color: #4CAF50;
              color: white;
              padding: 8px 16px;
              border: none;
              border-radius: 5px;
              cursor: pointer;
              font-size: 14px;
              width: 100%;
              margin-top: 10px;">
              + Agregar mensaje
          </button>
      `;
      messagesList.appendChild(addButtonDiv);

      // Agregar event listener al botón
      addButtonDiv.querySelector('.add-message-button').addEventListener('click', () => {
          followerMessages.push(''); // Agregar mensaje vacío
          localStorage.setItem('followerMessages', JSON.stringify(followerMessages));
          renderMessages();
      });
  }
}





messagesList.addEventListener('click', (e) => {
  if (e.target.closest('.follower-delete-btn')) {
      const index = e.target.closest('.follower-delete-btn').dataset.index;
      followerMessages.splice(index, 1);
      localStorage.setItem('followerMessages', JSON.stringify(followerMessages));
      renderMessages();
  }
});



  closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
  });

  messagesList.addEventListener('click', async (e) => {
      if (e.target.closest('.follower-delete-btn')) {
          const index = e.target.closest('.follower-delete-btn').dataset.index;
          followerMessages.splice(index, 1);
          // remove from database
          let res = await HowerAPI.removeFollowerMessages(username, index);
          if (!res) {
            alert("No se pudo eliminar el mensaje, por favor, inténtalo más tarde...");
          } else {
            renderMessages();
          }
      }
  });

  window.addEventListener('click', (e) => {
      if (e.target === modal) {
          modal.style.display = 'none';
      }
  });

  // Inicializar estado del botón
  toggleMessageButton();
});

document.getElementById('email').addEventListener('input', function () {
  const submitBtn = document.getElementById('openNewTabButtonPopup');
  const emailInput = document.getElementById('email');

  if (emailInput.value.trim() !== "") {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
  }
});




document.getElementById("homeSidebarOption").addEventListener("click", async () => {
  document.getElementById("mainContent").style.display = "none";
  document.getElementById("commentsContent").style.display = "none";
  document.getElementById("aiContent").style.display = "none";
  document.getElementById("sendersContent").style.display = "none";
  document.getElementById("settingsContent").style.display = "none";
  document.getElementById("searchPostsContent").style.display = "none";

  document.getElementById("welcomeSection").style.display = "block";
});


function getCurrentTanda(currMessageSentCounter, totalMessagesToSend, numTandas = getNumTandas(totalMessagesToSend)) {
  let res = (Math.floor(currMessageSentCounter / (totalMessagesToSend / numTandas)) % numTandas) + 1;
  if (res === 0) {
    return numTandas;
  }
  return res;
}

function getNumTandas(totalMessagesToSend) {
  // checar si es string
  if (typeof totalMessagesToSend === 'string') {
    totalMessagesToSend = parseInt(totalMessagesToSend);
  }

  if (totalMessagesToSend >= 41 && totalMessagesToSend <= 80) {
    return 3;
  } else if (totalMessagesToSend >= 21 && totalMessagesToSend <= 40) {
    return 2;
  } else if (totalMessagesToSend >= 1 && totalMessagesToSend <= 20) {
    return 1;
  }
}

let isProcessing = false;

document.getElementById('continueButton').addEventListener("click", async () => {

  if (isProcessing) return;

  isProcessing = true;

  if (!await instagramIsLoggedIn()) {
    alert("No se pudo iniciar sesión en Instagram, por favor, inicia sesión y vuelve a intentarlo.");
    return;
  }

  let data = await HowerAPI.getLatestMessageSent(howerUsername, howerToken);
  console.error(JSON.stringify(data));
  if (!data) {
    alert("Algo salió mal, inténtalo más tarde...");
    return;
  }

  ownerPostId = undefined;

  let messageComplete = data.messageComplete;
  let username = data.username.replace("_fromfile", "");
  let filters = data.filters;
  let gender = data.gender;

  document.getElementById("emailPrepared").value = username;
  document.getElementById("email").value = username;
  document.getElementById("filterWordPopupSending").value = filters;

  if (gender === "male") {
    selectedGender = "male";
    document.getElementById("genderRadio1").checked = true;
    document.getElementById("genderRadio2").checked = false;
    document.getElementById("genderRadio3").checked = false;
  } else if (gender === "female") {
    selectedGender = "female";
    document.getElementById("genderRadio1").checked = false;
    document.getElementById("genderRadio2").checked = true;
    document.getElementById("genderRadio3").checked = false;
  } else {
    selectedGender = "not_provided";
    document.getElementById("genderRadio1").checked = false;
    document.getElementById("genderRadio2").checked = false;
    document.getElementById("genderRadio3").checked = true;
  }

  document.getElementById("sendersSidebar").click();
  document.getElementById("cancelInstagramMessage6").style.display = 'none';
  document.getElementById("stopInstagramMessage").style.display = 'block';
  document.getElementById("prospectsToSend").textContent = username;

  //TODO:  poner la configuracion guardada de las tandas enviadas + mensajes totales

  // poner dentro de rows del table, todas las agregadas si es que el lastTimeSent es menor a 3 horas y aun no se completan
  // los mensajes de la tanda, desde el ultimo mensaje y la hora actual, 
  // de lo contrario, no poner nada, Y los tiempos de tandas, los vamos a setear
  // basado en el tiempo actal + 3 horas de diferencia, y si son 3 tandas (eso lo calculamos con la cantidad de mensajes totales desde la DB)

  if (DEBUG) console.error("[HOWER] - data: " + JSON.stringify(data));
  let currMessageSentCounter = parseInt(data?.currMessageTandaSentCounter ?? 0);
  let totalMessagesToSend = parseInt(data.totalMessagesToSend) || 20;
  let numTandas = data?.numTandas ?? getNumTandas(totalMessagesToSend);
  debugConsoleLog("Num Tandas from DB: " + data.numTandas);
  debugConsoleLog("Num Tandas finally set: " + numTandas);
  try {

    let data2 = await HowerAPI.getUsersMessageSent(data.username.replace("_fromfile", "").replaceAll('.', '_'), howerUsername);
    if (!data2) {
      return;
    }
    // const count = Object.entries(data2)
    //   .filter(([key, value]) => {
    //     // Ignorar si no es un objeto o es null
    //     if (!value || typeof value !== 'object') {
    //       return false;
    //     }

    //     // Verificar si tiene propiedad username
    //     if (!value.username) {
    //       return false;
    //     }

    //     // Verificar que no contenga las palabras prohibidas
    //     const username = value.username;
    //     const hasNotsent = username.includes('NOTSENT');
    //     const hasNotSent = username.includes('NOT_SENT');

    //     return !hasNotsent && !hasNotSent;
    //   }).length;

    // currMessageSentCounter = count;

    let lastDateTimeSent = new Date(data.lastDateTimeSent);

    let localSelectedTandaTimes;
    if (data.selectedTandaTimes) {
      if (Array.isArray(data.selectedTandaTimes)) {
        // Si es un array, usarlo directamente
        localSelectedTandaTimes = {
          tanda1: data.selectedTandaTimes[0] || "",
          tanda2: data.selectedTandaTimes[1] || "",
          tanda3: data.selectedTandaTimes[2] || ""
        };
      } else if (typeof data.selectedTandaTimes === 'object') {
        // Si es un objeto, extraer valores por propiedad
        localSelectedTandaTimes = {
          tanda1: data.selectedTandaTimes.tanda1 || "",
          tanda2: data.selectedTandaTimes.tanda2 || "",
          tanda3: data.selectedTandaTimes.tanda3 || ""
        };
      } else {
        if (DEBUG) console.error("[HOWER] - Invalid format for tanda times 2");
        localSelectedTandaTimes = {
          tanda1: "",
          tanda2: "",
          tanda3: ""
        };
      }
    } else {
      if (DEBUG) console.error("[HOWER] - Invalid format for tanda times");
      localSelectedTandaTimes = {
        tanda1: "",
        tanda2: "",
        tanda3: ""
      };
    }
    // if (DEBUG) console.error("[HOWER] - localSelectedTandaTimes: " + JSON.stringify(localSelectedTandaTimes));



    // Obtener el tiempo actual como objeto Date
    let currentTime = new Date();
    if (DEBUG) console.error("LAST DATETIME SENT " + lastDateTimeSent);
    if (DEBUG) console.error("CURRENT DATETIME " + currentTime);

    // Obtener la diferencia en milisegundos
    let timeDifference = currentTime.getTime() - lastDateTimeSent.getTime();


    stopUpdateInterval(); // stop the timer of tanda1

    if (DEBUG) console.error("[HOWER] - timeDifference: " + timeDifference);
    if (timeDifference < 10 * 60 * 60 * 1000) {
      if (DEBUG) console.error("[HOWER] - Es menor a 10 horas!");
      if (DEBUG) console.error("[HOWER] - currMessageSentCounter " + currMessageSentCounter.toString());
      if (DEBUG) console.error("[HOWER] - totalMessagesToSend " + totalMessagesToSend.toString());
      if (DEBUG) console.error("[HOWER] - getNumTandas(totalMessagesToSend) " + numTandas);
      if (DEBUG) console.error("[HOWER] - (totalMessagesToSend / getNumTandas(totalMessagesToSend) " + (totalMessagesToSend / numTandas)); // TODO: replace getNumTandas with numTandas from DB = 'numTandas' variable which is
      // si la diferencia de tiempo es menor a 3 horas, y aun quedan mensjes por enviar de una tanda, entonces mostrar los mensajes agregados
      if (timeDifference < (3 * 60 * 60 * 1000) && currMessageSentCounter > 0) { // || currMessageSentCounter % (totalMessagesToSend / getNumTandas(totalMessagesToSend)) !== 0) {
        // agregar dentro de rows los mensajes enviados y continuar
        // y agregar los tiempos de tandas a los elementos html desde selectedTandaTimes que es un array
        if (DEBUG) console.error("[HOWER] - Es menor a 3 horas!");
        let differenceToTanda = currMessageSentCounter % Math.floor(totalMessagesToSend / numTandas);// (totalMessagesToSend / getNumTandas(totalMessagesToSend)) - (currMessageSentCounter % (totalMessagesToSend / getNumTandas(totalMessagesToSend)));

        if (DEBUG) console.error("[HOWER] - differenceToTanda: " + differenceToTanda);

        if (timeDifference < 3 * 60 * 60 * 1000 && currMessageSentCounter % Math.floor(totalMessagesToSend / numTandas) === 0) {
          // this will make sure to make the user wait for the next tanda...
          differenceToTanda = totalMessagesToSend / numTandas;
          if (DEBUG) console.error("[HOWER] - differenceToTanda va a ser igual al numero de mensajes por tanda " + differenceToTanda);
        }

        while (differenceToTanda > 0) {
          const randomUsername = 'user_' + Math.random().toString(36).substring(2, 8);
          const randomTime = new Date(Date.now() - Math.floor(Math.random() * 3600000)).toLocaleTimeString();

          document.getElementById("sentMessagesTableBody").innerHTML += `<tr style="display: none;"><td>${randomUsername + "NOT_SENT"}</td><td>${randomTime}</td></tr>`;
          differenceToTanda--;
        }

        // now set in the dropdowns the selected tanda times
        // document.getElementById("numTandas").value = getNumTandas(totalMessagesToSend);
        // document.getElementById("numTandas").dispatchEvent(new Event('change'));

        document.getElementById("messageLimitPopup").value = totalMessagesToSend;
        document.getElementById("messageLimit").value = totalMessagesToSend;
        document.getElementById("messageLimit").dispatchEvent(new Event('input'));
        selectedTandaTimes = localSelectedTandaTimes; // this should be an array of 3 elements



        // Handle tanda dropdowns
        // const numTandas = getNumTandas(totalMessagesToSend);
        if (DEBUG) console.error("[HOWER] - numTandas: " + numTandas);
        // set the index of current tanda
        currentTanda = getCurrentTanda(currMessageSentCounter, totalMessagesToSend, numTandas);
        if (DEBUG) console.error("[HOWER] - currentTanda: " + currentTanda);
        if (DEBUG) console.error("[HOWER] - selectedTandaTimes: " + JSON.stringify(selectedTandaTimes));
        // For each possible tanda
        // for (let i = 1; i <= 3; i++) {
        //     const tandaElement = document.getElementById(`tanda${i}`);
        //     const tandaSelect = tandaElement.querySelector('.horario-select');

        //     if (i <= numTandas && selectedTandaTimes[i-1] !== "") {
        //         // Show and set value for active tandas
        //         tandaElement.style.display = "block";
        //         tandaSelect.value = selectedTandaTimes[i-1];
        //         if (DEBUG) console.error("[HOWER] - selectedTandaTimes[i-1]: " + selectedTandaTimes[i-1]);
        //         if (DEBUG) console.error("[HOWER] - Tanda " + i + " is set to " + selectedTandaTimes[i-1]);
        //     } else {
        //         // Hide inactive tandas
        //         tandaElement.style.display = "none";
        //         if (DEBUG) console.error("[HOWER] - Tanda " + i + " is hidden");
        //     }
        // }
        let selectedTandaTimesValues = Object.values(localSelectedTandaTimes);

        for (let i = 1; i <= MAX_NUM_TANDAS_ENABLED; i++) {
          try {
            const tandaElement = document.getElementById(`tanda${i}`);
            const tandaSelect = tandaElement.querySelector('.horario-select');
  
            if (i <= numTandas && selectedTandaTimesValues[i - 1] !== "") {
              // Show tanda element
              tandaElement.style.display = "block";
  
              // Check if the value exists in the options
              const valueExists = Array.from(tandaSelect.options).some(option =>
                option.value === selectedTandaTimesValues[i - 1]
              );
  
              // If value doesn't exist, add it as a new option
              if (!valueExists) {
                const newOption = document.createElement('option');
                newOption.value = selectedTandaTimesValues[i - 1];
                newOption.text = selectedTandaTimesValues[i - 1];
                tandaSelect.appendChild(newOption);
                if (DEBUG) console.error("[HOWER] - Added new option for Tanda " + i + ": " + selectedTandaTimesValues[i - 1]);
              }
  
              // Set the value
              tandaSelect.value = selectedTandaTimesValues[i - 1];
              if (DEBUG) console.error("[HOWER] - selectedTandaTimesValues[i-1]: " + selectedTandaTimesValues[i - 1]);
              if (DEBUG) console.error("[HOWER] - Tanda " + i + " is set to " + selectedTandaTimesValues[i - 1]);
            } else {
              // Hide inactive tandas
              tandaElement.style.display = "none";
              if (DEBUG) console.error("[HOWER] - Tanda " + i + " is hidden");
            }
          } catch (e) {
            debugConsoleLog("Hubo un error al continuar tus mensajes y usar las tandas " + e.toString());
          }
        }

      } else {
        if (DEBUG) console.error("[HOWER] - timeDifference is less than 3 hours");
        document.getElementById("messageLimit").value = totalMessagesToSend;
        document.getElementById("messageLimit").dispatchEvent(new Event('input'));

      }
    } else {
      if (DEBUG) console.error("[HOWER] - timeDifference is greater than 3 hours");
      document.getElementById("messageLimitPopup").value = totalMessagesToSend;
      document.getElementById("messageLimit").value = totalMessagesToSend;
      document.getElementById("messageLimit").dispatchEvent(new Event('input'));
    }

  } catch (error) {

    if (DEBUG) console.error("[HOWER] - Error getting data: " + error);
    // data does not exists
    document.getElementById("messageLimitPopup").value = data.messageLimit;
    document.getElementById("messageLimit").value = data.messageLimit;
    document.getElementById("messageLimit").dispatchEvent(new Event('input'));
  }
  // TODO: in here we put the number of tandas to send
  document.getElementById("numTandas").value = numTandas;
  document.getElementById("numTandas").dispatchEvent(new Event('input'));
  debugConsoleLog("Num Tandas set to numTandas select element " + numTandas);
  document.getElementById("numTandas").value = numTandas;

  // activate switch for follow followers, set message tiem delay to slider, and message limit to slider  
  document.getElementById("followFollowersCheckboxPopup").checked = shouldFollowFollowers;
  document.getElementById("waitTime").value = messageTimeDelay;
  // document.getElementById("messageLimitPopup").value = messageLimit;
  // activate handlers for follow followers, message time delay, and message limit

  disableSendMessagesButton();
  disableRestartMessages();

  enableContinueMessage("sendInstagramMessage2");
  enableContinueMessage("sendInstagramMessage3");
  enableContinueMessage("sendInstagramMessage4");


  closeNotification();
  isProcessing = false;
  

  if (data.username.includes("_fromfile")) {
    setSlideActive('carousel__slide2');
    requiresFileToContinue = true;
  } else {
    if (data.isComments) {
      document.getElementById("emailPrepared").value = `https://www.instagram.com/p/${username}`;
      document.getElementById("email").value = `https://www.instagram.com/p/${username}`;
    }


    setSlideActive('carousel__slide7');

    isSending = true;
  }

  // fulfill messageTexts
  messageTexts = messageComplete
    .split("\n&&\n")
    .map(message => {
      // Elimina espacios en blanco al inicio y final
      return message.trim();
    });
  await sendInstagramMessagePopupFunc(messageComplete);

});

document.getElementById("notificationClose").addEventListener("click", closeNotification);
document.getElementById("notificationCloseRetake").addEventListener("click", closeNotificationRetake);


function closeNotificationRetake() {
  const notification = document.getElementById('notificationPopupRestartInstance');

  // Agregar la clase 'hide' para iniciar la animación de desvanecimiento
  notification.classList.add('hide');
  isAlerted = false;

  // Esperar a que termine la animación antes de ocultar el elemento
  setTimeout(() => {
    notification.style.display = 'none';
  }, 500); // Tiempo debe coincidir con la duración de la animación (0.5s)
}

function closeNotificationWrongInspector() {
  const notification = document.getElementById('notificationPopupWrongInspector');

  // Agregar la clase 'hide' para iniciar la animación de desvanecimiento
  notification.classList.add('hide');

  // Esperar a que termine la animación antes de ocultar el elemento
  setTimeout(() => {
    notification.style.display = 'none';
  }, 500); // Tiempo debe coincidir con la duración de la animación (0.5s)  
}



function closeNotification() {
  const notification = document.getElementById('notificationPopup');

  // Agregar la clase 'hide' para iniciar la animación de desvanecimiento
  notification.classList.add('hide');

  // Esperar a que termine la animación antes de ocultar el elemento
  setTimeout(() => {
    notification.style.display = 'none';
  }, 500); // Tiempo debe coincidir con la duración de la animación (0.5s)
}

function closeNotificationRestartInstance() {
  const notification = document.getElementById('notificationPopupRestartInstance');

  // Agregar la clase 'hide' para iniciar la animación de desvanecimiento
  notification.classList.add('hide');

  // Esperar a que termine la animación antes de ocultar el elemento
  setTimeout(() => {
    notification.style.display = 'none';
  }, 500); // Tiempo debe coincidir con la duración de la animación (0.5s)
}

function closeNotificationRestartInstanceComments() {
  const notification = document.getElementById('notificationPopupRestartInstanceComments');

  // Agregar la clase 'hide' para iniciar la animación de desvanecimiento
  notification.classList.add('hide');

  // Esperar a que termine la animación antes de ocultar el elemento
  setTimeout(() => {
    notification.style.display = 'none';
  }, 500); // Tiempo debe coincidir con la duración de la animación (0.5s)
}

function reopenNotificationRestartInstance() {
  const notification = document.getElementById('notificationPopupRestartInstance');

  // Quitar la clase 'hide' para eliminar el efecto de desvanecimiento
  notification.classList.remove('hide');
}

function reopenNotificationWrongInspector() {
  const notification = document.getElementById('notificationPopupWrongInspector');

  // Quitar la clase 'hide' para eliminar el efecto de desvanecimiento
  notification.classList.remove('hide');
}

function reopenNotificationRestartInstanceComments() {
  const notification = document.getElementById('notificationPopupRestartInstanceComments');

  // Quitar la clase 'hide' para eliminar el efecto de desvanecimiento
  notification.classList.remove('hide');
}

// document.getElementById("messageLimitPopup").addEventListener("input", function () {
//   document.getElementById("messageLimitLabelPopup").innerText = this.value + " mensajes";

//   let messageLimitOriginal = document.getElementById("messageLimit");
//   messageLimitOriginal.value = this.value;

//   messageLimitOriginal.dispatchEvent(new Event('input'));
// });



document.getElementById("waitTimePopup").addEventListener("input", function () {
  if (this.value === 5 || this.value.toString() === "5") {
    document.getElementById("waitTimeLabelPopup").innerText = "5 minutos";
  } else {
    document.getElementById("waitTimeLabelPopup").innerText = this.value + " minutos";
  }

  let messageLimitOriginal = document.getElementById("waitTime");
  messageLimitOriginal.value = this.value;

  messageLimitOriginal.dispatchEvent(new Event('input'));
});


// document.getElementById('howerAIClickableSpan').addEventListener('click', async function() {
//   // Aquí va la acción que deseas realizar al hacer clic
//   await showPopupPublications();
// });

document.getElementById("closePopupButtonPublications").addEventListener("click", closePopupPublications);


document.getElementById("closePopupButtonLeadBooster").addEventListener("click", function () {
  closePopupLeadBooster();

  // use this prospects as data!!
  let intersections = findUsernameIntersections(OUTPUT_LEAD_BOOSTER_DATA);
  if (DEBUG) console.error("[HOWER] - Intersections: " + JSON.stringify(intersections));

  // set the source to the new list of people
  lines = intersections;
  lines_business = intersections;

  document.getElementById("emailCount").innerText = 'Cuentas obtenidas totales: ' + intersections.length;
});

function closePopupLeadBooster() {
  document.getElementById("popupOverlayLeadBooster").style.display = "none";
  document.getElementById("welcomeLeadBoosterPopup").style.display = "none";
}

function closePopupPublications() {
  document.getElementById("popupOverlayPublicationsPopup").style.display = "none";
  document.getElementById("welcomePublicationsPopup").style.display = "none";
}

async function loadPosts() {
  if (DEBUG) console.error("[HOWER] - Loading posts");
  //create an element to show loading with animation
  let loadingElement = document.createElement("div");
  loadingElement.innerHTML = '<h3 style="color: #7a60ff;">Cargando publicaciones...</h3>';
  document.getElementById("listContainerPublications").appendChild(loadingElement);

  let posts = await HowerAPI.loadPosts(howerUsername, howerToken);
  document.getElementById("listContainerPublications").removeChild(loadingElement);

  if (!posts || posts.length === 0) {
    // remove loading element
    // show on popup that posts werent loaded
    document.getElementById("listContainerPublications").innerHTML = '<h3 style="color: #7a60ff;">No se encontraron publicaciones </h3><small style="color: white;">Espera a recibir por medio de WhatsApp publicaciones recomendadas de Hower AI</small>';
    return;
  }

  // show posts on popup
  document.getElementById("listContainerPublications").innerHTML = Object.entries(posts).map(([postLink, commentCount]) => {
    // Replace '>' with '/' and '<' with '.' in the post link
    const formattedLink = postLink.replace(/>/g, '/').replace(/</g, '.');

    // Generate a random ID
    const randomId = 'item-' + Math.random().toString(36).substr(2, 9); // Generates a random ID

    return `<div class="list-item" id="${randomId}" style="background-color: white;"> 
                <div class="username" style="color: #4B0082; padding: 10px 10px 0 0; overflow: hidden; text-overflow: ellipsis;"> <!-- Añadido padding para espacio -->
                    ${formattedLink.length > 30 ? '...' + formattedLink.slice(-27) : formattedLink}
                </div>
                <input type="hidden" value="${formattedLink}">
                <div class="comment-count" style="justify-content: flex-end;"> 
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="16" height="16" style="vertical-align: middle; margin-right: 5px;">
                        <path fill="#000000" d="M512 240c0 114.9-114.6 208-256 208c-37.1 0-72.3-6.4-104.1-17.9c-11.9 8.7-31.3 20.6-54.3 30.6C73.6 471.1 44.7 480 16 480c-6.5 0-12.3-3.9-14.8-9.9c-2.5-6-1.1-12.8 3.4-17.4c0 0 0 0 0 0s0 0 0 0s0 0 0 0c0 0 0 0 0 0l.3-.3c.3-.3 .7-.7 1.3-1.4c1.1-1.2 2.8-3.1 4.9-5.7c4.1-5 9.6-12.4 15.2-21.6c10-16.6 19.5-38.4 21.4-62.9C17.7 326.8 0 285.1 0 240C0 125.1 114.6 32 256 32s256 93.1 256 208z"/>
                    </svg>
                    ${commentCount}
                    <a href="${formattedLink}" target="_blank" style="margin-left: 10px; font-size: 12px; padding: 2px 5px; background-color: #4B0082; color: white; border: none; border-radius: 3px; cursor: pointer; text-decoration: none; display: flex; align-items: center;"> <!-- Añadido display: flex y align-items: center -->
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" width="12" height="12" style="fill: white; margin-right: 5px; vertical-align: middle;"><path d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141zm0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7zm146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8zm76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1s-34.4 58-36.2 93.9c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8zM398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1z"/></svg>
                        Ver
                    </a>
                </div>
            </div>`;
  }).join('');

  const listItems = document.querySelectorAll("#listContainerPublications .list-item");
  listItems.forEach(item => {
    const usernameDiv = item.querySelector(".username");
    const formattedLink = item.querySelector("input[type='hidden']").value; // Obtener el enlace formateado

    usernameDiv.addEventListener("click", function () {
      insertLinkAndClosePopup(formattedLink); // Llama a la función con el enlace correspondiente
    });
  });

  if (DEBUG) console.error("[HOWER] - Posts loaded");
}

function findUsernameIntersections(dataDict) {
  const usernameData = {};

  // Iterate over each key in the dictionary
  for (const key in dataDict) {
    const list = dataDict[key];

    // Create a Set to track unique usernames in the current list
    const uniqueUsernames = new Set();

    // Iterate over each object in the list
    // for (const obj of list) {
    //   const username = obj.node.username;

    //   // Add the username to the Set
    //   uniqueUsernames.add(username);

    // }

    // // Update the count of each unique username
    // for (const username of uniqueUsernames) {
    //   if (usernameCount[username]) {
    //     usernameCount[username]++;
    //   } else {
    //     usernameCount[username] = 1;
    //   }
    // }
    for (const obj of list) {
      const username = obj.node.username;
      const profilePic = obj.node.profile_pic_url; // Assuming this is the correct path to the profile picture
      const fullName = obj.node.full_name;
      // Add the username to the Set
      uniqueUsernames.add(username);

      // Store profile picture if not already stored
      if (!usernameData[username]) {
        usernameData[username] = { count: 0, profilePic: profilePic, fullName: fullName };
      }
    }

    for (const username of uniqueUsernames) {
      usernameData[username].count++;
    }
  }

  // Filter usernames that appear in more than one list
  const intersections = [];
  for (const [username, data] of Object.entries(usernameData)) {
    if (data.count > 1) {
      // Format the string as requested
      intersections.push(`${data.fullName},${username},${data.count},,`);
    }
  }

  intersections.sort((a, b) => b.count - a.count);


  return intersections;
}


OUTPUT_LEAD_BOOSTER_DATA = {};

function updateProgressBar() {
  try {
    const initialCountElems = Object.keys(OUTPUT_LEAD_BOOSTER_DATA).length * 2000;
    let countElemsFinal = 0;

    for (const userId in OUTPUT_LEAD_BOOSTER_DATA) {
      countElemsFinal += OUTPUT_LEAD_BOOSTER_DATA[userId].length;
    }

    let progress = (countElemsFinal / initialCountElems) * 100;
    document.getElementById("progressBarLeadBooster").style.width = progress + "%";
    // document.getElementById("progressBarLeadBooster").style.borderRadius = "10px";
  } catch (error) {
    if (DEBUG) console.error("[HOWER] - Error updating progress bar: " + error);
  }
}



async function getCommentUsersFromPost(postId, instagramApi) {
  if (followersLst.length !== 0) {
    // Check if the inspection has been done before
    return;
  }

  const max_data = 50;
  let has_next_page = true;
  let end_cursor = null;
  const output = { data: [], has_next_page: true };

  while (has_next_page) {
    const query_params = {
      query_hash: "33ba35852cb50da46f5b5e889df7d159",
      variables: `{"shortcode":"${postId}","first":${max_data},"after":"${end_cursor}"}`,
    };

    try {
      const url = GRAPHQL_URL;
      if (DEBUG) console.error("URL " + url);
      if (DEBUG) console.error("COOKIES " + JSON.stringify(session.cookies));
      if (DEBUG) console.error("CSRF_TOKEN " + csrf_token);

      const response = await instagramApi.makeRequestFollowers(url, query_params);
      if (DEBUG) console.error(response);
      const data = response.data.shortcode_media.edge_media_to_comment;

      has_next_page = data.page_info.has_next_page;
      end_cursor = data.page_info.end_cursor;

      const comments = data.edges;
      comments.forEach((node) => {
        if (
          !followersLst.find(
            (follower) => follower.node.id === node.node.owner.id ||
              (ownerPostId && node.node.owner.id.toString() === ownerPostId?.toString())
          )
        ) {
          followersLst.push({
            node: {
              is_private: false,
              id: node.node.owner.id,
              username: node.node.owner.username,
            },
          });
        }
      });

      if (isSending) {
        followersLst.forEach(async (data) => {
          const username = data.node?.username || "";
          const is_business = true;
          const fullName = ""; // await this.fetchTitleBeforeAt("https://www.instagram.com/" + username);

          lines_business.push(
            `${fullName},${username},${""},${""},${is_business}`
          );

          lines.push(
            `${fullName},${username},${""},${""},${is_business}`
          );
        });

        if (followersLst.length >= followersLstIsSendingLimit) {
          return;
        }

        document.getElementById("emailCount").textContent = "Cuentas obtenidas totales: " + followersLst.length;
      }

      document.getElementById("cuentasDisponiblesComments").textContent = followersLst.length;

      output.data.push(comments);
      output.has_next_page = has_next_page;

    } catch (error) {
      if (DEBUG) console.error(error);
      continue;
    } finally {
      const delayDuration = 10000; // 10 seconds
      await new Promise((resolve) => setTimeout(resolve, delayDuration));
    }
  }

  return output;
}

async function get_user_friends(userId, followers_list = false, followings_list = false, instagramApi) {
  if ((!followers_list && !followings_list) || (followers_list && followings_list)) {
    throw new Error("Set either the followers_list or the followings_list to True.");
  }

  const max_data = 50;
  let has_next_page = true;
  let end_cursor = null;

  while (has_next_page) {
    const query_params = instagramApi.generate_query(
      FOLLOWERS_LIST_QUERY,
      max_data,
      userId,
      end_cursor,
      "follow_list_page",
      null,
      null,
      true
    );

    try {
      const url = GRAPHQL_URL;
      const response = await instagramApi.makeRequestFollowers(url, query_params);
      const data = response.data.user.edge_followed_by.edges;

      if (OUTPUT_LEAD_BOOSTER_DATA[userId] === undefined) {
        OUTPUT_LEAD_BOOSTER_DATA[userId] = [];
      }
      OUTPUT_LEAD_BOOSTER_DATA[userId].push(...data);
      updateProgressBar();

      if (OUTPUT_LEAD_BOOSTER_DATA[userId].length > 2000) {
        // just have a look to the first 2000
        return;
      }

      if (DEBUG) console.error("[HOWER] - Data fetched for user " + userId);
      if (DEBUG) console.error("[HOWER] - Data: " + JSON.stringify(data));

      // Update pagination info
      has_next_page = response.data.user.edge_followed_by.page_info.has_next_page;
      end_cursor = response.data.user.edge_followed_by.page_info.end_cursor;

    } catch (error) {
      if (DEBUG) console.error("Error fetching user friends: " + error);
      throw error; // Re-throw the error to be handled by the caller
    } finally {
      // Introduce a delay before the next iteration
      const delayDuration = 10000; // 10 seconds
      await new Promise((resolve) => setTimeout(resolve, delayDuration));
    }
  }

  return OUTPUT_LEAD_BOOSTER_DATA[userId]; // Return the accumulated data
}

async function showLeadsFromLeadBooster() {
  // primero obtenemos el texto de la caja de texto
  let text = document.getElementById("emailPrepared").value;
  const instagramApi = new InstagramApi();

  const windowId = await createWindow({
    url: "https://www.instagram.com/accounts/login/?hl=es-es",
    type: "normal",
  }).id;

  // separamos los elementos conforme a el &&
  let elements = text.split("&&");

  extractHeaders(windowId);
  extractCookies(windowId);


  // convert each username to user id
  await delay(5000);

  session = {
    cookies: newCookies,
    headers: newHeaders,
  };

  const userIds = [];
  // const postsIds = [];

  // for (const postUrl of elements) {
  //   if (DEBUG) console.error("[HOWER] - Post URL: " + postUrl);
  //   // postsIds.push(userId);

  //   const match = postUrl.match(/\/(p|reel)\/(.*?)(\/#|\/|$)/);
  //   if (match && match.length > 1) {
  //     const extractedValue = match[2]; // This is the value you want
  //     console.log("Extracted Value: " + extractedValue);
  //     postsIds.push(extractedValue);
  //   }
  // }
  for (const element of elements) {
    const userId = await getUserId(element, newHeaders);
    if (DEBUG) console.error("[HOWER] - User ID: " + userId);
    userIds.push(userId);
  }

  //if (DEBUG) console.error("[HOWER] - User IDs: " + JSON.stringify(userIds));


  // Create an array of promises for each element
  // const promises = userIds.map(userId => 
  //   get_user_friends(userId, true, false, instagramApi),
  // );

  // if (DEBUG) console.error("[HOWER] - Posts IDs: " + JSON.stringify(postsIds));

  const promises = userIds.map(postId =>
    get_user_friends(postId, true, false, instagramApi)
  );

  // const promises = postsIds.map(postId =>  
  //   getCommentUsersFromPost(postId, instagramApi)
  // );

  document.getElementById("welcomePublicationsPopup").style.display = "none";
  document.getElementById("popupOverlayPublicationsPopup").style.display = "none";
  document.getElementById("popupOverlayLeadBooster").style.display = "block";
  document.getElementById("welcomeLeadBoosterPopup").style.display = "block";
  document.getElementById("popupOverlayConf").style.display = "none";
  document.getElementById("welcomePopupConf").style.display = "none";
  document.getElementById("closePopupButtonLeadBooster").style.display = "none";

  // new elements
  document.getElementById("textCountLeadBooster").style.display = "none";
  document.getElementById("progressBarLeadBooster").style.display = "block";
  document.getElementById("listContainerLeadBooster").style.display = "none";

  await Promise.all(promises);

  // old elements
  document.getElementById("textCountLeadBooster").style.display = "block";
  document.getElementById("progressBarLeadBooster").style.display = "none";
  document.getElementById("listContainerLeadBooster").style.display = "block";
  document.getElementById("closePopupButtonLeadBooster").style.display = "block";

  if (DEBUG) console.error("[HOWER] - Data fetched for all users");
  if (DEBUG) console.error("[HOWER] - Data: " + JSON.stringify(OUTPUT_LEAD_BOOSTER_DATA));

  // Count occurrences of each element across all lists
  let intersections = findUsernameIntersections(OUTPUT_LEAD_BOOSTER_DATA);
  if (DEBUG) console.error("[HOWER] - Intersections: " + JSON.stringify(OUTPUT_LEAD_BOOSTER_DATA));

  document.getElementById("countLeadBooster").innerText = intersections.length;
  // show the intersections with repetitions in a popupWindow


  // add elements to the container of the popup window
  for (const intersection of intersections) {
    let card = document.createElement("div");
    card.style.cssText = `
      display: flex;
      align-items: center;
      border: 1px solid #ccc;
      border-radius: 8px;
      padding: 10px;
      margin: 10px 0;
      background-color: #f9f9f9;
    `;

    let profileImage = document.createElement("img");
    profileImage.src = 'https://i.ibb.co/2vkXYhr/Hower-logo.png';//intersection.profilePic;
    profileImage.alt = "Profile Image";
    profileImage.style.cssText = `
      width: 50px;
      height: 50px;
      border-radius: 50%;
      margin-right: 10px;
    `;

    let userInfo = document.createElement("div");
    userInfo.style.cssText = `
      font-size: 14px;
      color: black;
    `;
    userInfo.innerHTML = `<strong>${intersection.split(",")[0]}</strong> (${intersection.split(",")[2]} apariciones)`;

    card.appendChild(profileImage);
    card.appendChild(userInfo);

    document.getElementById("listContainerLeadBooster").appendChild(card);
  }

}



document.getElementById("buttonPublicationsLeadBooster").addEventListener("click", async () => {
  await showLeadsFromLeadBooster();

});


document.getElementById("leadBoosterCheckboxPopup").addEventListener("change", async function () {
  if (this.checked) {
    document.getElementById("popupOverlayLeadBooster").style.display = "block";
    document.getElementById("welcomeLeadBoosterPopup").style.display = "block";
    await showLeadsFromLeadBooster();
  } else {
    document.getElementById("buttonPublicationsLeadBooster").style.display = "none";
  }
});

function insertLinkAndClosePopup(link) {
  document.getElementById("emailPrepared").value = link; // Insert the link into the input
  closePopupPublications(); // Close the popup
  enableContinueMessage("sendInstagramMessage3");
}

async function showPopupPublications() {
  document.getElementById("popupOverlayPublicationsPopup").style.display = "block";
  document.getElementById("welcomePublicationsPopup").style.display = "block";

  // load posts
  await loadPosts();
}

const spanElement = document.getElementById('howerAIClickableSpan');
const tooltip = spanElement.querySelector('.tooltip');

spanElement.addEventListener('mouseenter', () => {
  tooltip.style.display = 'block';
});

spanElement.addEventListener('mouseleave', () => {
  tooltip.style.display = 'none';
});


document.getElementById("closeButtonConf").addEventListener("click", closePopupConf);
// document.getElementById("closeButtonConfDisplay").addEventListener("click", closePopupConfDisplay);




document.getElementById("emailPrepared").addEventListener("input", async function () {
  let emailValue = document.getElementById("emailPrepared").value;
  
  const matchPost = emailValue.match(/\/(p|reel)\/(.*?)(\/#|\/|$)/);
  if (matchPost) {
    // Si es una URL de post/reel, realizar las acciones automáticas
    const postInput = document.getElementById('emailPreparedPost');
    showUrlPostWindow();
    postInput.value = emailValue;
    postInput.dispatchEvent(new Event('input'));
    
    return;
  }
  
  // Si no es un post/reel, extraer el nombre de usuario de una URL de Instagram
  if (emailValue.includes('instagram.com/')) {
    // Obtener todo lo que está después de instagram.com/
    let username = emailValue.split('instagram.com/')[1];
    // Si hay más slashes, solo tomar la primera parte (el nombre de usuario)
    username = username.split('/')[0];
    // Actualizar el valor del input con solo el nombre de usuario
    document.getElementById("emailPrepared").value = username;
    emailValue = username;
  }
  // Remove the '@' character from the string
  let updatedValue = emailValue.replace(/@/g, '');

  // Reassign the updated value back to the input field
  document.getElementById("emailPrepared").value = updatedValue;

  emailValue = document.getElementById("emailPrepared").value;

  const query = emailValue;

  

  if (query) {
    await fetchInstagramData(query);
  } else {
    // Limpiar resultados si el input está vacío
    document.getElementById('searchResults').innerHTML = '<div style="padding: 20px; text-align: center; color: #8e8e8e;">Introduce la cuenta de Instagram a prospectar a sus seguidores</div>';
    document.getElementById('searchResults').innerHTML = '';

  }


  if (emailValue === "") {
    // bad
    disableContinueMessage("sendInstagramMessage3");
    return;
  }

  // Check if the value contains www.instagram.com
  if (emailValue.includes("www.instagram.com")) {
    // Extract the part immediately after www.instagram.com/
    const match = emailValue.match(/www\.instagram\.com\/([^\/?]+)/);
    if (match && match[1]) {
      const extractedValue = match[1]; // This is the value you want
      console.log("Extracted Value: " + extractedValue);
      document.getElementById("emailPrepared").value = updatedValue;
      // You can now use extractedValue as needed
    }
  }


  enableContinueMessage("sendInstagramMessage3");

});








async function addUserToSetAndBackendMessageSent(username) {
  if (DEBUG) console.error("[HOWER] - Verificando si usuario existe en mensajes registrados");
  if (
    !username ||
    username.length === 0
  ) {
    if (DEBUG) console.error("[HOWER] - USERNAME ESTA VACIO PARA REGISTRAR");
    return;
  }

  if (getTableRowsMessagesSent() >= messageLimit) {
    return;
  }

  username = username + "_NOTSENT" // add the NOTSENT TO THE USERNAME
  usersMessageSentSet.add(username);

  if (DEBUG) console.error("[HOWER] - Mensaje de envio registrado - CUENTA PRIVADA O NO SE PUEDE ENVIAR MENSAJE");

  const match = filenameMessagesSent.match(/\/(p|reel)\/(.*?)(\/#|\/|$)/);
  let localFilenameMessagesSent = filenameMessagesSent.replace(/\./g, "_");
  if (match && match.length > 1) {
    // match[2] contiene la cadena que buscas (el ID del post o reel)
    localFilenameMessagesSent = match[2];
  }

  const now = new Date();

  // Obtener los componentes de la fecha y hora
  const day = String(now.getDate()).padStart(2, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = String(now.getFullYear()).slice(-2);
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

  console.error("username:", username);
  console.error("localFilenameMessagesSent:", localFilenameMessagesSent);
  console.error("howerUsername:", howerUsername);
  console.error("cleanedMessage:", cleanedMessage);
  console.error("formattedDateTime:", formattedDateTime);
  console.error("message:", document.getElementById("message").value);
  console.error("filterWordPopupSending:", document.getElementById("filterWordPopupSending").value);
  console.error("localFilenameMessagesSent (original):", localFilenameMessagesSent);
  console.error("true (constant):", true);
  console.error("shouldFollowFollowers:", shouldFollowFollowers);
  console.error("messageTimeDelay:", messageTimeDelay);
  console.error("messageLimit:", messageLimit);
  console.error("selectedGender:", selectedGender);



  dataResponse = await HowerAPI.registerMessageSentUser(username, localFilenameMessagesSent, howerUsername, cleanedMessage, formattedDateTime, document.getElementById("message").value, document.getElementById("filterWordPopupSending").value, localFilenameMessagesSent, currentInspector === "Comments", shouldFollowFollowers, messageTimeDelay, messageLimit, selectedGender);
  if (DEBUG) console.error("[HOWER] - Mensaje de envio registrado - FIN");
}


function getLocalISOString() {
  const date = new Date();
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - (offset * 60000));
  return localDate.toISOString().slice(0, -1); // Removemos la 'Z' del final
}

document.getElementById("waitTime").addEventListener("input", function () {
  messageTimeDelay = document.getElementById("waitTime").value;
  document.getElementById("waitTimeLabel").innerText = messageTimeDelay;
  messageTimeDelay = parseInt(messageTimeDelay);

  // recalculateAllTandas();
  document.getElementById("messageLimit").dispatchEvent(new Event('input'));
});


function getTableRowsMessagesSent() {
  // get the len of tr from the table body element sentMessagesTableBody
  const tableBody = document.getElementById("sentMessagesTableBody");
  const rows = tableBody.getElementsByTagName("tr");
  return rows.length;
}


document.getElementById('moreFiltersBtn').addEventListener('click', function() {
  const moreFilters = document.getElementById('moreFiltersOptions');
  moreFilters.style.display = moreFilters.style.display === 'none' ? 'block' : 'none';
});



chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
  if (request.action === "userMessageSentFront") {
    if (getTableRowsMessagesSent() >= messageLimit) {
      return;
    }

    if (DEBUG) console.error("[HOWER] - Recibiendo peticion de 'useeMessageSentFront'");
    messageCounter += 1;
    addUserToTableUI(request.username, request.message_time_sent);
    const now = new Date();

    // Obtener los componentes de la fecha y hora
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    let dataResponse = undefined;
    messageSent = true;
    counterMessagesWasNotSent = 0; // restart counter
    counterMessagesNotFollowAllowed = 0;
    counterMessagesMessageButtonBan = 0;
    // alert("USERNMAE " + username  + " FILENAME " + filenameMessagesSent + " howerUSERNME " + howerUsername + " CLEANED " + cleanedMessage + " TIME " + formattedDateTime);
    if (DEBUG) console.error(`[HOWER] - Agregando a mensajes registrados' - ${request.username}`);
    if (isSending) {
      if (currentInspector === "Comments") {
        // set variable to it
        const match = filenameMessagesSent.match(/\/(p|reel)\/(.*?)(\/#|\/|$)/);
        let localFilenameMessagesSent = "";
        if (match && match.length > 1) {
          // match[2] contiene la cadena que buscas (el ID del post o reel)
          localFilenameMessagesSent = match[2];
        }
        const validMessagesCount = Array.from(usersMessageSentSet)
          .filter(username => {
            return !username.includes('NOT_SENT') &&
              !username.includes('NOTSENT');
          })
          .length;

        // await addUserToSetAndBackendMessageSent(request.username);

        dataResponse = await HowerAPI.registerMessageSentUser(request.username, localFilenameMessagesSent.replace(/\./g, "_"), howerUsername, cleanedMessage, formattedDateTime, document.getElementById("message").value, document.getElementById("filterWordPopupSending").value, localFilenameMessagesSent, true, shouldFollowFollowers, messageTimeDelay, messageLimit, selectedGender, messageLimit, validMessagesCount, getLocalISOString(), selectedTandaTimes, document.getElementById("numTandas").value);
      } else {
        const validMessagesCount = Array.from(usersMessageSentSet)
          .filter(username => {
            return !username.includes('NOT_SENT') &&
              !username.includes('NOTSENT');
          })
          .length;

        //await addUserToSetAndBackendMessageSent(request.username);

        dataResponse = await HowerAPI.registerMessageSentUser(request.username, filenameMessagesSent.replace(/\./g, "_"), howerUsername, cleanedMessage, formattedDateTime, document.getElementById("message").value, document.getElementById("filterWordPopupSending").value, filenameMessagesSent, false, shouldFollowFollowers, messageTimeDelay, messageLimit, selectedGender, messageLimit, validMessagesCount, getLocalISOString(), selectedTandaTimes, document.getElementById("numTandas").value);
      }
    } else {
      const validMessagesCount = Array.from(usersMessageSentSet)
        .filter(username => {
          return !username.includes('NOT_SENT') &&
            !username.includes('NOTSENT');
        })
        .length;

      // await addUserToSetAndBackendMessageSent(request.username);

      dataResponse = await HowerAPI.registerMessageSentUser(request.username, filenameMessagesSent.replace(/\./g, "_") + "_fromfile", howerUsername, cleanedMessage, formattedDateTime, document.getElementById("message").value, "", filenameMessagesSent.replace(/\./g, "_") + "_fromfile", false, shouldFollowFollowers, messageTimeDelay, messageLimit, selectedGender, messageLimit, validMessagesCount, getLocalISOString(), selectedTandaTimes, document.getElementById("numTandas").value);
    }

    await pauseIfBanned();
    if (DEBUG) console.error(`[HOWER] - Registrado en enviados' - ${request.username}`);
    // disablePauseMessagesButton();
  } else if (request.action === "unfocusWindow") {
    if (DEBUG) console.error(`[HOWER] - Desenfocando Ventana!!'`);
    unfocusWindow(request.windowId);
  } else if (request.action === "focusWindow") {
    if (DEBUG) console.error(`[HOWER] - Enfocando Ventana!!'`);
    focusWindow(request.windowId);
  } else if (request.action === "ignoreUserFront") {
    //wasNotInMessageRequests = true;
    if (DEBUG) console.error(`[HOWER] - Ignorando usuario!!'`);
    unfocusWindow(request.windowId);
  } else if (request.action === "ignoreUserCompleteFront") {
    //wasNotInMessageRequests = true;
    if (DEBUG) console.error(`[HOWER] - Ignorando usuario completo!!'`);
    counterMessagesMessageButtonBan++;
    abortController.abort();
    await pauseIfBanned();

  } else if (request.action === "stopFollowing") {
    if (DEBUG) console.error(`[HOWER] - Dejando de seguir!!'`);
    // let checkbox = document.getElementById("followFollowersCheckbox");
    // checkbox.checked = false;
    // checkbox.dispatchEvent(new Event('change'));
  } else if (request.action === "userMessageNotAllowedFront") {
    if (DEBUG) console.error(`[HOWER] - No se puede enviar mensaje a usuario!!'`);
    messageSent = true;
    await addUserToSetAndBackendMessageSent(request.usernameMessageSent);

    abortController.abort();

    // add to users SENT
    // counterMessagesWasNotSent++;
  } else if (request.action === "userMessageNotButtonFront") {
    if (DEBUG) console.error(`[HOWER] - No se puede enviar mensaje a usuario - BOTON!!'`);
    messageSent = true;
    counterMessagesMessageButtonBan++;

    // if the amount of times, Hower has clicked on the follow and is not reacting, overpasses the limit, then we should not follow anymore!
    // TODO, DESCOMENTAR
    // if (counterMessagesNotFollowAllowed > LIMIT_FOLLOW_UNTIL_BAN) {
    //   let checkbox = document.getElementById("followFollowersCheckbox");
    //   checkbox.checked = false;
    //   checkbox.dispatchEvent(new Event('change'));
    // }

    await addUserToSetAndBackendMessageSent(request.usernameMessageSent);

    abortController.abort();
    await pauseIfBanned();
  } else if (request.action === "isPrivateAccountFront") {
    if (DEBUG) console.error(`[HOWER] - Cuenta es privada!! - BOTON!!'`);
    isPrivateAccount = true;
    await addUserToSetAndBackendMessageSent(request.usernameMessageSent);

    abortController.abort();

    // add to users SENT

  } else if (request.action === "userMessageMessageButtonBanFront") {
    if (DEBUG) console.error(`[HOWER] - Cuenta baneada de enviar mensajes!!'`);
    counterMessagesMessageButtonBan++;
    // DESCOMENTAR
    // if (shouldFollowFollowers) {
    //   counterMessagesWasNotSent++;
    // }
    isPrivateAccount = true;
    abortController.abort();
    await pauseIfBanned();
  } else if (request.action === "readyListNewFollowersFront") {
    if (DEBUG) console.error(`[HOWER] - Lista de nuevos seguidores obtenida!!'`);
    listNewFollowers = request.usernamesNewFollowers;
  }
    
});

function focusWindow(windowId) {
  if (localStorage.getItem("focusWindowCheckbox") && localStorage.getItem("focusWindowCheckbox") === "true") {
    chrome.windows.update(windowId, {
      // focused: true, 
      state: 'normal' // Asegúrate de que la ventana no esté maximizada ni minimizada.
    }, function () {
      chrome.windows.update(windowId, {
        width: 800,
        height: 600
      });
    });
  } else {
    chrome.windows.get(windowId, {}, function (window) {
      if (window.state === "minimized") {
        chrome.windows.update(windowId, {
          state: 'normal' // Cambia el estado a 'normal' solo si está minimizada
        }, function () {
          chrome.windows.update(windowId, {
            width: 800,
            height: 600
          });
        });
      }
    });
  }
}


function addNewWord() {
  if (document.getElementById('searchPostsInputContainer').getElementsByTagName('input').length >= 8) {
    return;
  }

  const inputContainer = document.getElementById('searchPostsInputContainer');
  const newInput = document.createElement('input');
  const label = document.createElement('label');
  label.textContent = 'Palabra ' + (inputContainer.getElementsByTagName('input').length + 1);
  newInput.type = 'text';
  newInput.placeholder = 'Palabras de tu nicho';
  inputContainer.appendChild(label);
  inputContainer.appendChild(newInput);
}

function addNewWordFilters() {
  if (document.getElementById('searchPostsInputContainerFilters').getElementsByTagName('input').length >= 3) {
    return;
  }

  const inputContainer = document.getElementById('searchPostsInputContainerFilters');
  const newInput = document.createElement('input');
  const label = document.createElement('label');
  label.textContent = 'Ubicacion ' + (inputContainer.getElementsByTagName('input').length + 1);
  newInput.type = 'text';
  newInput.placeholder = 'Ubicacion';
  inputContainer.appendChild(label);
  inputContainer.appendChild(newInput);
}

function deleteLastWordFilters() {
  const inputContainer = document.getElementById('searchPostsInputContainerFilters');
  const inputs = inputContainer.getElementsByTagName('input');
  const labels = inputContainer.getElementsByTagName('label'); // Obtener todos los labels

  if (inputs.length > 1) { // Asegurarse de que al menos un input permanezca
    inputContainer.removeChild(inputs[inputs.length - 1]); // Eliminar el último input
    inputContainer.removeChild(labels[labels.length - 1]); // Eliminar el último label
  }
}


// Función para eliminar el último input
function deleteLastWord() {
  const inputContainer = document.getElementById('searchPostsInputContainer');
  const inputs = inputContainer.getElementsByTagName('input');
  const labels = inputContainer.getElementsByTagName('label'); // Obtener todos los labels

  if (inputs.length > 3) { // Asegurarse de que al menos un input permanezca
    inputContainer.removeChild(inputs[inputs.length - 1]); // Eliminar el último input
    inputContainer.removeChild(labels[labels.length - 1]); // Eliminar el último label
  }
}

// Función para obtener los valores de los inputs en un array
function getInputValues() {
  const inputContainer = document.getElementById('searchPostsInputContainer');
  const inputContainerFilters = document.getElementById('searchPostsInputContainerFilters');
  const inputs = inputContainer.getElementsByTagName('input');
  const inputFilters = inputContainerFilters.getElementsByTagName('input');
  const values = [];
  for (let i = 0; i < inputs.length; i++) {
    values.push(inputs[i].value);
  }
  const filters = [];
  for (let i = 0; i < inputFilters.length; i++) {
    filters.push(inputFilters[i].value);
  }
  return {
    values: values,
    filters: filters,
  }
}

// Función que se llama al hacer clic en el botón "Buscar"
async function searchPosts() {
  const { values, filters } = getInputValues();

  if (searchByComments) {
    // open a new window with _blank with the following command:
    const newTab = await chrome.tabs.create({
      url: `https://www.google.com/search?q=site%3Ainstagram.com+(%22comenta%22+or+%22escribe%22+or+%22deja%22+or+%22sorteo%22+or+%22comenta+con%22)+${toParamConverter(values, filters)}`,
      active: true // Esto asegura que la pestaña se abra en primer plano
    });

    // Enfocar la ventana de la nueva pestaña
    chrome.windows.update(newTab.windowId, { focused: true });
  } else {
    // open a new window with _blank with the following command:
    const newTab = await chrome.tabs.create({
      url: `https://www.google.com/search?q=site%3Ainstagram.com+${toParamConverter(values, filters)}`,
      active: true // Esto asegura que la pestaña se abra en primer plano
    });

    // Enfocar la ventana de la nueva pestaña
    chrome.windows.update(newTab.windowId, { focused: true });
  }
}

function toParamConverter(values, filters) {
  // join with + and Or, and with "", y todo el string con un parentesis al inicio y al final
  if (filters || filters.length > 0) {
    return `+(${values.map(value => `"${value}"`).join("+OR+")})+(${filters.map(filter => `"${filter}"`).join("+OR+")})`;
  }
  return `+(${values.map(value => `"${value}"`).join("+OR+")})`;


}

document.getElementById('searchByLocationButton').addEventListener('click', function () {
  document.getElementById('slide1').style.display = 'none';
  document.getElementById('slide2').style.display = 'block';
});

document.getElementById('backToFiltersButton').addEventListener('click', function () {
  document.getElementById('slide2').style.display = 'none';
  document.getElementById('slide1').style.display = 'block';
});

// Asignar eventos a los botones
document.getElementById('addNewWordButton').onclick = addNewWord;
document.getElementById('deleteLastWordButton').onclick = deleteLastWord;
document.getElementById('searchPostsButton').addEventListener('click', async () => {
  await searchPosts();
});
document.getElementById('searchPostsButtonLocation').addEventListener('click', async () => {
  await searchPosts();
});

document.getElementById('addNewWordFiltersButton').onclick = addNewWordFilters;
document.getElementById('deleteLastWordFiltersButton').onclick = deleteLastWordFilters;



async function pauseIfBanned() {
  if (counterMessagesMessageButtonBan >= 3) {
    if (DEBUG) console.error("[HOWER] - Cuenta baneada de enviar mensajes!! - PAUSANDO");
    await stopMessagesInsta();
    return true;
  }
  return false;
}

function unfocusWindow(windowId) {
  if (localStorage.getItem("focusWindowCheckbox") && localStorage.getItem("focusWindowCheckbox") === "true") {
    chrome.windows.update(windowId, { state: "minimized" }, function (window) {
      // Aquí puedes agregar cualquier acción adicional que necesites realizar.
      chrome.windows.update(windowId, {
        width: 800,
        height: 600
      });
    });
  }
}

function addUserToTableUI(username, message_time_sent) {
  if (
    !username ||
    !message_time_sent ||
    username.length === 0 ||
    message_time_sent.length === 0 ||
    usersMessageSentSet.has(username) || // and check if for username + "_NOTSENT"
    usersMessageSentSet.has(username + "_NOTSENT")
  ) {
    return;
  }

  usersMessageSentSet.add(username);

  var tableBody = document.getElementById("sentMessagesTableBody");

  // Create a new row and cells
  var newRow = document.createElement("tr");
  newRow.style.width = "100%";

  var usernameCell = document.createElement("td");
  var dateCell = document.createElement("td");
  dateCell.style.fontSize = "10px";
  usernameCell.style.fontSize = "10px";

  // Set the text content of the cells
  usernameCell.textContent = username;
  if (usernameCell.textContent.length > 15) {
    usernameCell.textContent =
      usernameCell.textContent.substring(0, 15) + "...";
  }

  dateCell.textContent = message_time_sent;

  // Append the cells to the row
  newRow.appendChild(usernameCell);
  newRow.appendChild(dateCell);

  tableBody.appendChild(newRow);

  // get the rows in the table
  const rows = tableBody.getElementsByTagName("tr");
  const validRows = Array.from(rows).filter(row => {
    const rowText = row.textContent || row.innerText;
    return !rowText.includes('NOTSENT') && !rowText.includes('NOT_SENT');
  });

  const messageTotalSentCounter = document.getElementById("messageTotalSentCounter");
  messageTotalSentCounter.textContent = validRows.length;
}

// document.getElementById('logoutIGButton').addEventListener('click', changeIGSession);

// function createWindow(options) {
//   return new Promise((resolve, reject) => {
//     chrome.windows.create(options, (newWindow) => {
//       if (chrome.runtime.lastError) {
//         return reject(chrome.runtime.lastError);
//       }
//       resolve(newWindow);
//     });
//   });
// }


function createWindow(options) {
  return new Promise((resolve, reject) => {
    chrome.windows.create({
      ...options,
      focused: false, // Do not focus the window
      state: 'normal' // Prevent minimization
    }, (newWindow) => {
      if (chrome.runtime.lastError) {
        return reject(chrome.runtime.lastError);
      }

      // Find the tab in the newly created window
      chrome.tabs.query({ windowId: newWindow.id }, (tabs) => {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        if (tabs && tabs.length > 0) {
          const tabId = tabs[0].id; // Get the first tab's ID

          // Inject logic into the tab to keep it active
          chrome.scripting.executeScript({
            target: { tabId: tabId, allFrames: true },
            func: () => {
              // Simulate activity to prevent suspension
              function keepAlive() {
                document.body.style.transform = `scale(${1 + Math.random() * 0.0001})`;
                console.log('Keeping the render active...');
                requestAnimationFrame(keepAlive);
              }
              keepAlive();
            }
          }, () => {
            if (chrome.runtime.lastError) {
              if (DEBUG) console.error('Error injecting script:', chrome.runtime.lastError.message);
            } else {
              console.log('Activity script injected into the tab.');
            }
          });
        } else {
          if (DEBUG) console.error('No tabs found in the created window.');
        }
      });

      resolve(newWindow);
    });
  });
}





async function changeIGSession() {
  if (igPoolAccounts === false) {
    return false; // probably heres a test account, do not consider test accounts
  }

  // let instaTab = await chrome.tabs.create({ url: 'https://www.instagram.com/accounts/login/' });
  const newWindow = await createWindow({
    url: "https://www.instagram.com/accounts/login/?hl=es-es",
    type: "normal",
  });

  let screenWidth = screen.availWidth;
  let screenHeight = screen.availHeight;

  // Resize the window to fill the screen
  chrome.windows.update(newWindow.id, {
    width: screenWidth,
    height: screenHeight,
    left: 0,
    top: 0,
  });

  const windowId = newWindow.id;
  console.log("New window created with ID:", windowId);

  // Get the ID of the first tab in the new window
  let instaTab = null;
  if (newWindow.tabs && newWindow.tabs.length > 0) {
    instaTab = newWindow.tabs[0];
  }

  setTimeout(async () => {
    const response = await chrome.tabs.sendMessage(instaTab.id, {
      action: "logoutInstagram",
      instaTabId: instaTab.id,
      windowId: windowId,
    });

    await new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === "complete" && tabId === instaTab.id) {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });

    setTimeout(async () => {
      await loginInstagram(); // then login

      chrome.windows.remove(windowId, function () {
        // remove window opened
      });
    }, 30000); // 30 seconds
  }, 5000);
}

//document.getElementById('loginIGButton').addEventListener('click',

function delayLogin(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function removeCaptchas() {
  try {
    const newWindow = await createWindow({
      url: `https://www.instagram.com/${getRandomWord()}`, // "https://www.instagram.com/accounts/login/?hl=es-es", // CHANGE
      type: "popup",
      state: "maximized",
    });

    let screenWidth = screen.availWidth;
    let screenHeight = screen.availHeight;

    // Resize the window to fill the screen
    chrome.windows.update(newWindow.id, {
      width: screenWidth,
      height: screenHeight,
      left: 0,
      top: 0,
    });

    const windowId = newWindow.id;
    console.log("New window created with ID:", windowId);

    // Get the ID of the first tab in the new window
    let instaTab = null;
    if (newWindow.tabs && newWindow.tabs.length > 0) {
      instaTab = newWindow.tabs[0];
    }

    await new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === "complete" && tabId === instaTab.id) {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });

    let response = await chrome.tabs.sendMessage(instaTab.id, {
      action: "removeCaptchas",
      instaTabId: instaTab.id,
      windowId: windowId,
    });

    setTimeout(() => {
      chrome.windows.remove(windowId, function () {
        // remove window opened
      });
      if (DEBUG) console.error("WINDOW CLOSED");
    }, 20000); // minute and a half
  } catch (e) {
    if (DEBUG) console.error("ERROR IN THE CAPTCHA REMOVE FUNCTION " + e.toString());
  }
}

document.getElementById('closePopupPostsSearcher').addEventListener('click', function () {
  document.getElementById('welcomePopupPostsSearcher').style.display = 'none';
  document.getElementById('popupOverlayPostsSearcher').style.display = 'none';
});

async function loginInstagram() {
  stopMessages = false;

  //let instaTab = await chrome.tabs.create({ url: 'https://www.instagram.com/accounts/login/?next=%2F&source=mobile_nav' });
  const newWindow = await createWindow({
    url: "https://www.instagram.com/accounts/login/?hl=es-es",
    type: "popup",
    state: "maximized",
  });

  let screenWidth = screen.availWidth;
  let screenHeight = screen.availHeight;

  // Resize the window to fill the screen
  chrome.windows.update(newWindow.id, {
    width: screenWidth,
    height: screenHeight,
    left: 0,
    top: 0,
  });

  const windowId = newWindow.id;
  console.log("New window created with ID:", windowId);

  // Get the ID of the first tab in the new window
  let instaTab = null;
  if (newWindow.tabs && newWindow.tabs.length > 0) {
    instaTab = newWindow.tabs[0];
  }

  // let instaTab = await chrome.tabs.create({
  //   url: "https://www.instagram.com/accounts/login/",
  // });

  // select randon user IG

  const keys = Object.keys(igPoolAccounts);

  const randomKey = keys[currentWorkerIndex % keys.length];
  currentWorkerIndex++; // INDEX for worker account

  // Obtener el valor correspondiente
  const randomValue = igPoolAccounts[randomKey];

  // Asignar la clave y el valor a variables
  currentWorkerUsername = randomKey;
  currentWorkerPassword = randomValue;

  // alert("USERNAME: " + selectedKey + " PASSWORD " + selectedValue);

  const USERNAME = currentWorkerUsername; //  'testacchower5' //
  const PASSWORD = currentWorkerPassword; // 'testhower1'

  await new Promise((resolve) => {
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (info.status === "complete" && tabId === instaTab.id) {
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    });
  });

  while (true) {
    try {
      let response = await chrome.tabs.sendMessage(instaTab.id, {
        action: "loginInstagram",
        instaTabId: instaTab.id,
        windowId: windowId,
        username: USERNAME,
        password: PASSWORD,
      });

      // You can now use the response object
      // if (response.status === "Done") {
      //   if (response.message === "true") {
      //     // add it into the main list
      //     followersMessageSent.push(username);
      //   }
      // }

      break;
    } catch (error) {
      if (DEBUG) console.error("Error sending message:", error);
      let randomTime = random(messageTimeDelay, messageTimeDelay);
      responseMessage = `Error al enviar, Esperando ${Math.floor(
        randomTime / 1000 / 60
      )} minutos`;
      await delayLogin(5000);
    }
  }
  // finally, create the .csv from the background.js file

  setTimeout(async () => {
    chrome.windows.remove(windowId, function () {
      // remove window opened
    });

    await removeCaptchas(); // then login
  }, 1000 * 60 + 10000);
}

document
  .getElementById("downloadFilteredButton")
  .addEventListener("click", async function () {
    let inputKeywords = document.getElementById("filterWordPopup");
    let inputKeywordsExclude = document.getElementById("filterWordPopupExclude");

    let keywords = inputKeywords.value;
    let keywordsExclude = inputKeywordsExclude.value;

    let keywordArray = keywords.split(",");
    let keywordArrayExclude = keywordsExclude.split(",");

    // whitespace from each keyword (optional, but often useful)
    keywordArray = keywordArray.map((keyword) => keyword.trim());
    keywordArrayExclude = keywordArrayExclude.map((keyword) => keyword.trim());

    await createCSV(fullEmailFollowerData, keywordArray, keywordArrayExclude);
  });

document
  .getElementById("downloadButton")
  .addEventListener("click", async function () {
    await createCSV(fullEmailFollowerData);
  });

// Selecciona el input usando su ID
// document.getElementById("messagePopup0").addEventListener("click", function () {
//   if (hasAppeared) {
//     return;
//   }
//   hasAppeared = true;
//   showPopupAI();
// });

document.getElementById("messagePrepared").addEventListener("click", function () {
  if (hasAppeared) {
    return;
  }
  hasAppeared = true;
  // showSavedMessagesPopup();
  // showPopupAI();
  showPopupSeparateMessages();
});

document
  .getElementById("closeButtonAI")
  .addEventListener("click", async function () {
    await closePopupAI();
  });

document
  .getElementById("closeButtonAISeparateMessages")
  .addEventListener("click", async function () {
    await closePopupAISeparateMessages();
  });


function showPopupSeparateMessages() {
  if (
    !localStorage.getItem("dontShowAgainAISeparateMessages") ||
    localStorage.getItem("dontShowAgainAISeparateMessages") === "false"
  ) {
    document.getElementById("popupOverlayAISeparateMessages").style.display = "none";
    document.getElementById("welcomePopupAISeparateMessages").style.display = "none";
  }
}


function showPopupAI() {
  if (
    !localStorage.getItem("dontShowAgainAI") ||
    localStorage.getItem("dontShowAgainAI") === "false"
  ) {
    document.getElementById("popupOverlayAI").style.display = "block";
    document.getElementById("welcomePopupAI").style.display = "flex";
  }
}

async function closePopupAI() {
  document.getElementById("popupOverlayAI").style.display = "none";
  document.getElementById("welcomePopupAI").style.display = "none";
}

async function closePopupAISeparateMessages() {
  document.getElementById("popupOverlayAISeparateMessages").style.display = "none";
  document.getElementById("welcomePopupAISeparateMessages").style.display = "none";
}

async function showPopupConf() {
  //document.getElementById("popupOverlayConf").style.display = "block";
  //document.getElementById("welcomePopupConf").style.display = "flex";
}

async function closePopupConf() {
  document.getElementById("popupOverlayConf").style.display = "none";
  document.getElementById("welcomePopupConf").style.display = "none";

  fulfillData();

  setSlideActive("carousel__slide7");
}

async function showPopupConfDisplay() {
  document.getElementById("popupOverlayConfDisplay").style.display = "block";
  document.getElementById("welcomePopupConfDisplay").style.display = "flex";
}

async function closePopupConfDisplay() {
  document.getElementById("popupOverlayConfDisplay").style.display = "none";
  document.getElementById("welcomePopupConfDisplay").style.display = "none";
}

function showPopupFollowingDone() {
  document.getElementById("popupOverlayFollowingDone").style.display = "block";
  document.getElementById("welcomePopupFollowingDone").style.display = "flex";
}

function closePopupFollowingDone() {
  document.getElementById("popupOverlayFollowingDone").style.display = "none";
  document.getElementById("welcomePopupFollowingDone").style.display = "none";
}

function showPopupUpdatesAvailable() {
  if (
    !localStorage.getItem("dontShowAgainUpdatesAvailable") ||
    localStorage.getItem("dontShowAgainUpdatesAvailable") === "false"
  ) {
    document.getElementById("popupOverlayUpdatesAvailable").style.display = "block";
    document.getElementById("welcomePopupUpdatesAvailable").style.display = "flex";
  }
}

async function showNotificationLatestMessage() {
  let data = await HowerAPI.getLatestMessageSent(howerUsername, howerToken);
  if (data && data.no_show === false) {
    if (data.username.includes("&&")) {
      data.username = 'prospectosleadbooster';
    }
    document.getElementById('notificationPopupUsername').textContent = "@" + data.username.replace("_fromfile", "");
    document.getElementById('notificationPopup').style.display = 'flex';
  }
}

function closePopupUpdatesAvailable() {
  document.getElementById("popupOverlayUpdatesAvailable").style.display = "none";
  document.getElementById("welcomePopupUpdatesAvailable").style.display = "none";
}


function showPopupInspectorInstructions() {
  if (
    !localStorage.getItem("dontShowAgainInspectorInstructions") ||
    localStorage.getItem("dontShowAgainInspectorInstructions") === "false"
  ) {
    document.getElementById("popupOverlayInspectorInstructions").style.display = "block";
    document.getElementById("welcomePopupInspectorInstructions").style.display = "flex";
  }
}

document
  .getElementById("dontShowAgainInspectorInstructions")
  .addEventListener("change", function () {
    if (this.checked) {
      // Acción a realizar cuando se hace check
      console.log(
        'La opción "No volver a mostrar este mensaje" ha sido seleccionada.'
      );
      // Aquí puedes agregar el código que desees ejecutar cuando se seleccione la casilla
      // Por ejemplo, guardar el estado en localStorage
      localStorage.setItem("dontShowAgainInspectorInstructions", "true");
    } else {
      // Acción a realizar cuando se desmarca
      console.log(
        'La opción "No volver a mostrar este mensaje" ha sido desmarcada.'
      );
      // Puedes agregar el código para revertir la acción, si es necesario
      localStorage.removeItem("dontShowAgainInspectorInstructions");
    }
  });


async function closePopupInspectorInstructions() {
  document.getElementById("popupOverlayInspectorInstructions").style.display = "none";
  document.getElementById("welcomePopupInspectorInstructions").style.display = "none";
}


document.getElementById("changePostAfterPopupButton").addEventListener('click', () => {
  document.getElementById("popupOverlayFollowingDone").style.display = 'none';
  document.getElementById("welcomePopupFollowingDone").style.display = 'none';
  
  // restart messages
  document.getElementById("restartMessages").click();
});


document.getElementById("changeGenderButton").addEventListener('click', () => {
  document.getElementById("popupOverlayFollowingDone").style.display = 'none';
  document.getElementById("welcomePopupFollowingDone").style.display = 'none';
  
  // go back to slide of gender...
  document.getElementById('cancelInstagramMessage6').click();
  document.getElementById('cancelInstagramMessageConf').click();
});


document
  .getElementById("closeButtonInspectorInstructions")
  .addEventListener("click", async function () {
    await closePopupInspectorInstructions();
  });



document.getElementById("focusWindowCheckbox").addEventListener("change", function () {
  localStorage.setItem("focusWindowCheckbox", this.checked);
});

// updates section

async function requiresUpdate() {
  try {
    const manifest = chrome.runtime.getManifest();
    // Acceder a la versión
    let version = manifest.version;

    return await HowerAPI.isOutdatedVersion(version);
  } catch (e) {
    return true;
  }
}



document.getElementById("networkerOption").addEventListener("click", function () {
  // hide current wndow
  document.getElementById("welcomeSectionPresentation").style.display = "none";

  // deactivate back button from it
  document.getElementById("backButtonInstagramMessage").style.display = "none";

  // delete sidebar items that are not necesary AND change click for Send Instagram message
  document.getElementById("homeSidebarOption").style.display = "none";
  document.getElementById("followersInspectorSidebarSeparator").style.display = "none";
  document.getElementById("followersInspectorSidebar").style.display = "none";
  document.getElementById("commentsInspectorSidebar").style.display = "none";
  document.getElementById("emailSenderSidebar").style.display = "none";

  // remove the settings of inspector product from the setting part
  document.getElementById("inspectorSettings").style.display = "none";

  // change the backbuttons from the senders
  document.getElementById("cancelInstagramMessagePost2").onclick = function () {
    setSlideActive("carousel__slide3");
  }

  document.getElementById("cancelInstagramMessagePost").onclick = function () {
    setSlideActive("carousel__slide3");
  }

  document.getElementById("restartMessages").onclick = function () {
    restartMessagesFunction();
    setSlideActive("carousel__slide3");
  }

  document.getElementById("cancelInstagramMessage4").onclick = function () {
    if (isSending === false) {
      disableBackInstaDMButton('cancelInstagramMessage2');
      setSlideActive('carousel__slide3');
    } else {
      // show popup alert for starting again
      if (confirm("¿Quieres enviar mensajes a otras cuentas?")) {
        restartMessagesFunction();
        setSlideActive('carousel__slide3');
      }
    }
  }

  // activate menu toggle
  document.getElementById("menuToggle").style.display = "block";
  // activate main content window
  document.getElementById("sendersContent").style.display = "block";
  document.getElementById("carousel__slide1").style.display = "none";
  document.getElementById("aiReturnButton").style.display = "none";
  isSending = true; // couble check this!

  setSlideActive("carousel__slide3");

  executeInstagramLoginCheck();
  // show notification of latest message
  showNotificationLatestMessage();
});



function executeInstagramLoginCheck() {
  chrome.windows.create(
    { url: `https://www.instagram.com/reels/${getRandomWord()}`, state: "minimized" },
    function (newWindow) {
      openedTabId = newWindow.tabs[0].id;

      // First timeout to extract data
      setTimeout(function () {
        // extractDataFromWindow(newWindow.id, false);
        extractCookies(newWindow.id);

        // Second timeout to close the window
        setTimeout(function () {
          chrome.windows.remove(newWindow.id, function () {
            if (chrome.runtime.lastError) {
              if (DEBUG) console.error("Error closing window:", chrome.runtime.lastError);
            }
          });
        }, 4000); // Cierra la ventana 6 segundos después de extraer los datos

      }, 2000);
    }
  );
}


document.getElementById("otherEntrepreneurOption").addEventListener("click", function () {
  document.getElementById("welcomeSectionPresentation").style.display = "none";


  // activate menu toggle
  document.getElementById("menuToggle").style.display = "block";
  // activate main content window
  document.getElementById("welcomeSection").style.display = "block";
  document.getElementById("aiReturnButton").style.display = "none";
  // show notification of latest message
  showNotificationLatestMessage();
});


document.getElementById("aiReturnButton").addEventListener("click", function () {
  document.getElementById("welcomeSectionPresentation").style.display = "block";
  document.getElementById("searchPostsContent2").style.display = "none";
});


document.getElementById("closePopupConfDisplay").addEventListener("click", function () {
  document.getElementById("popupOverlayConfDisplay").style.display = "none";
  document.getElementById("welcomePopupConfDisplay").style.display = "none";
});


document
  .getElementById("validateButton")
  .addEventListener("click", async function () {
    const usernameInput = document.getElementById("username");
    const tokenInput = document.getElementById("token");

    howerUsername = usernameInput.value;
    howerToken = tokenInput.value;

    if (!howerUsername || !howerToken) {
      alert(
        "Username y Token son campos requeridos, llenalos e intenta de nuevo."
      );
      return;
    }

    if (await HowerAPI.tokenNeedsValidation(howerUsername, howerToken)) {
      // If token is valid, store it and show main content
      // chrome.storage.sync.set({ 'username': username, 'token': token });
      tokenContent.style.display = "none";
      welcomeSectionPresentation.style.display = "block"; // TODO, llevalo aqui

      document.getElementById("networkerOption").click();


      localStorage.setItem("username", howerUsername);
      localStorage.setItem("token", howerToken);

      // do this for the background.js and handling the notifications
      chrome.storage.local.set({
        username: howerUsername,
        token: howerToken
      }, function () {
        console.log('Credenciales guardadas en chrome.storage.local');
      });


      showSidebarPostsSearcher();


      if (await HowerAPI.isNewUser(howerUsername, howerToken)) {
        // show popup 
        localStorage.setItem("dateNewUserSaved", new Date().toISOString());
        showPopupSendersNewUser();
      } else {
        let dateNewUserSaved = localStorage.getItem("dateNewUserSaved");
        if (dateNewUserSaved !== null && dateNewUserSaved !== "") {
          let dateNewUserSavedDate = new Date(dateNewUserSaved);
          let dateNow = new Date();
          let diffTime = Math.abs(dateNow - dateNewUserSavedDate);
          let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          if (diffDays > 1) {
            // if has passed a day, we can show the user the popup of the Hower AI!!
            localStorage.removeItem("dateNewUserSaved");
            showPopupUserHowerAiRecos();
          } 
        }
      }

      // show popup of updates available (if neccesary)
    } else {
      // If token is invalid, show an alert
      alert("Token invalido, intenta de nuevo.");
    }
  });

function showPopupUserHowerAiRecos() {
  document.getElementById("popupOverlaySendersHowerAiRecos").style.display = "block";
  document.getElementById("welcomePopupSendersHowerAiRecos").style.display = "flex";
}

function closePopupUserHowerAiRecos() {
  document.getElementById("popupOverlaySendersHowerAiRecos").style.display = "none";
  document.getElementById("welcomePopupSendersHowerAiRecos").style.display = "none";
}

document
  .getElementById("hashtagInspectorSidebar")
  .addEventListener("click", () => {
    //document.getElementById('mainContent').style.display = 'none';
    // include all other inspectors main panels
    // document.getElementById('hashtagContent').style.display = 'block';
  });

// function countEmailsCorrect(inputElement) {
//   var file = inputElement.files[0];
//   if (!file) {
//     document.getElementById("emailCount").innerText =
//       "Correos obtenidos totales: 0";
//     return;
//   }

//   lines = []; // just in case
//   if (!isSending && !isInspectingAndSending) {
//     filenameMessagesSent = file.name;
//     filenameMessagesSent = filenameMessagesSent.slice(
//       0,
//       filenameMessagesSent.length - 4
//     );
//   }

//   var reader = new FileReader();
//   reader.onload = function (e) {
//     var content = e.target.result;
//     lines = content.split("\n");
//     if (DEBUG) console.error(lines.length);
//     var emailCount = 0;
//     var tableContent = "<table>";
//     var isBusinessIndex = -1;




//       var columns = line.split(",");
//       if (index === 0) {
//         columns.forEach((col, colIndex) => {
//           headers.push(col);
//           countColumns++;
//           if (col.trim() === "is_business" || col.trim() === '"is_business"') {
//             isBusinessIndex = colIndex;
//           }
//         });
//       }

//       tableContent += "<tr>";
//       columns.forEach((col) => {
//         tableContent += `<td>${col.trim()}</td>`;
//       });
//       tableContent += "</tr>";

//       // Contar correos
//       if (index === 0 || line.trim() === "") return;
//       if (columns[1] && columns[1].trim() !== "") {
//         emailCount++;
//       }

//       if (
//         isBusinessIndex !== -1 &&
//         (columns[isBusinessIndex]?.trim().toLowerCase() === '"true"' ||
//           columns[isBusinessIndex]?.trim().toLowerCase() === "true" ||
//           columns[isBusinessIndex]?.trim().toLowerCase() === "'true'")
//       ) {
//         lines_business.push(line);
//       }
//     });

//     var businessLines = [];
//     var nonBusinessLines = [];

//     lines.forEach((line, index) => {
//       var columns = line.split(",");
//       if (
//         index > 0 &&
//         columns[isBusinessIndex] &&
//         (columns[isBusinessIndex]?.trim().toLowerCase() === '"true"' ||
//           columns[isBusinessIndex]?.trim().toLowerCase() === "true" ||
//           columns[isBusinessIndex]?.trim().toLowerCase() === "'true'")
//       ) {
//         businessLines.push(line);
//       } else {
//         nonBusinessLines.push(line);
//       }
//     });

//     lines = businessLines.concat(nonBusinessLines);
//     lines = lines.filter(
//       (line) =>
//         !line.includes("full_name,username,public_email,contact_phone_number")
//     );

//     if (
//       lines.length > 0 &&
//       lines[0].includes("full_name,username,public_email,contact_phone_number")
//     ) {
//       //&& lines[0] === "full_name,username,public_email,contact_phone_number\r") || (lines.length > 0 && lines[0] === "full_name,username,public_email,contact_phone_number,is_business\r") || (lines.length > 0 && lines[0] === "full_name,username,public_email,contact_phone_number,is_business") || (lines.length > 0 && lines[0] === "full_name,username,public_email,contact_phone_number")) {
//       lines.shift();
//     }

//     if (countColumns <= 4) {
//       lines_business = lines; // in case there are previous versions of file running in the software
//     }

//     if (DEBUG) console.error("LINES TO SEND MESSAGES " + JSON.stringify(lines));

//     tableContent += "</table>";

//     document.getElementById("emailCount").innerText =
//       "Cuentas obtenidas totales: " + emailCount;

//     // document.querySelector('.csvDataDiv').style.width = '50%'; // Mostrar datos en el nuevo div
//   };
//   reader.readAsText(file);
// }


document.getElementById('closePopupNewUpdateDetails').addEventListener('click', function () {
  closePopupNewUpdate();
});

document.getElementById('closePopupAIFollowUps').addEventListener('click', function () {
  document.getElementById('popupOverlayAIFollowUps').style.display = 'none';
  document.getElementById('welcomePopupAIFollowUps').style.display = 'none';
});

async function showSidebarPostsSearcher() {
  let res = await HowerAPI.isPostsSearcherFeatureEnabled();
  if (res) {
    document.getElementById("searchPostsSidebar").style.display = "block";
  }
}


function countEmailsCorrect(inputElement) {
  var file = inputElement.files[0];
  if (!file) {
    document.getElementById("emailCount").innerText =
      "Correos obtenidos totales: 0";
    document.getElementById("emailCount2").innerText =
      "Correos obtenidos totales: 0";
    disableContinueMessage("sendInstagramMessage2");
    return;
  }

  lines = [];
  filenameMessagesSent = file.name;
  enableSendMessagesButton();

  try {
    filenameMessagesSent = filenameMessagesSent.slice(
      0,
      filenameMessagesSent.length - 4
    );

    var reader = new FileReader();
    reader.onload = function (e) {
      var content = e.target.result;

      // Detecta si se usa un delimitador de coma, punto y coma, o tabulación
      //var separator = ',';
      var separator = content.includes(',') ? ',' : ';';

      lines = content.split("\n");
      var emailCount = 0;
      var tableContent = "<table>";
      isBusinessIndex = -1;
      usernameIndex = -1;
      fullNameIndex = -1;
      var headers = [];
      var businessLines = [];
      var nonBusinessLines = [];

      lines.forEach((line, index) => {
        var columns = line.split(separator);
        if (index === 0) {
          // Manejo de encabezados
          columns.forEach((col, colIndex) => {
            headers.push(col);
            if (col.trim().toLowerCase() === "is_business" || col.trim().toLowerCase() === '"is_business"') {
              isBusinessIndex = colIndex;
            }
            if (col.trim().toLowerCase() === "username" || col.trim().toLowerCase() === '"username"') {
              usernameIndex = colIndex;
            }
            if (col.trim().toLowerCase() === "full_name" || col.trim().toLowerCase() === '"full_name"') {
              fullNameIndex = colIndex;
            }
          });
          return; // Saltar la primera línea (encabezado)
        }

        tableContent += "<tr>";
        columns.forEach((col) => {
          tableContent += `<td>${col.trim()}</td>`;
        });
        tableContent += "</tr>";

        // Cuenta los correos basándose en la columna 'public_email'
        if (usernameIndex !== -1 && columns[usernameIndex] && columns[usernameIndex].trim() !== "") {
          emailCount++;
        }

        // Clasifica las líneas como negocio o no negocio
        if (
          isBusinessIndex !== -1 &&
          (columns[isBusinessIndex]?.trim().toLowerCase() === '"true"' ||
            columns[isBusinessIndex]?.trim().toLowerCase() === "true" ||
            columns[isBusinessIndex]?.trim().toLowerCase() === "'true'")
        ) {
          businessLines.push(line);
        } else {
          nonBusinessLines.push(line);
        }
      });

      if (isBusinessIndex === -1 || usernameIndex === -1 || fullNameIndex === -1) {
        showPopupBadFilePopup();
        disableContinueMessage("sendInstagramMessage2");
        return;
      }

      // Combina las líneas de negocio primero, luego las no negocio
      lines = businessLines.concat(nonBusinessLines);
      lines_business = lines;

      if (lines.length > 0) {
        enableContinueMessage("sendInstagramMessage2");
      }

      tableContent += "</table>";

      document.getElementById("emailCount").innerText =
        "Cuentas obtenidas totales: " + emailCount;
      document.getElementById("emailCount2").innerText =
        "Cuentas obtenidas totales: " + emailCount;

      console.log("Líneas procesadas:", lines);
    };
    reader.readAsText(file);
  } catch (e) {
    showPopupBadFilePopup();
    disableContinueMessage("sendInstagramMessage2");
  }

}


// document
//   .getElementById("nameIdentifierMessagePopup")
//   .addEventListener("click", function () {
//     var inputElem = document.getElementById("messagePopup");
//     if (!inputElem) return; // Verifica si el elemento existe

//     var startPos = inputElem.selectionStart;
//     var endPos = inputElem.selectionEnd;
//     var textBefore = inputElem.value.substring(0, startPos);
//     var textAfter = inputElem.value.substring(endPos, inputElem.value.length);

//     inputElem.value = textBefore + "[NOMBRE]" + textAfter;

//     // Mover el cursor a la posición después del texto insertado
//     inputElem.selectionStart = inputElem.selectionEnd = startPos; //  + text.length;
//   });

// document
//   .getElementById("personalizationIdentifierMessagePopup")
//   .addEventListener("click", function () {
//     var inputElem = document.getElementById("messagePopup");
//     if (!inputElem) return; // Verifica si el elemento existe

//     var startPos = inputElem.selectionStart;
//     var endPos = inputElem.selectionEnd;
//     var textBefore = inputElem.value.substring(0, startPos);
//     var textAfter = inputElem.value.substring(endPos, inputElem.value.length);

//     inputElem.value = textBefore + "[PERSONALIZATION_IDENTIFIER]" + textAfter;

//     // Mover el cursor a la posición después del texto insertado
//     inputElem.selectionStart = inputElem.selectionEnd = startPos; //  + text.length;
//   });


let activeInput = null; // Variable para almacenar el input activo

// Detectar el input activo cuando recibe foco
document.addEventListener("focusin", function (event) {
  if (event.target.tagName === "INPUT" && event.target.type === "text") {
    activeInput = event.target; // Guardamos el input que tiene el foco
  }
});

// Función genérica para insertar texto en el input activo
function insertTextAtCursor(text) {
  if (!activeInput) return; // Verifica si hay un input activo

  var startPos = activeInput.selectionStart;
  var endPos = activeInput.selectionEnd;
  var textBefore = activeInput.value.substring(0, startPos);
  var textAfter = activeInput.value.substring(endPos, activeInput.value.length);

  activeInput.value = textBefore + text + textAfter;

  // Mover el cursor a la posición después del texto insertado
  activeInput.selectionStart = activeInput.selectionEnd = startPos + text.length;
}

// Añadir listeners para los botones
document
  .getElementById("nameIdentifierMessagePopup")
  .addEventListener("click", function () {
    insertTextAtCursor("[NOMBRE]");
  });

document
  .getElementById("personalizationIdentifierMessagePopup")
  .addEventListener("click", function () {
    insertTextAtCursor("[PERSONALIZATION_IDENTIFIER]");
  });


document.addEventListener('keydown', function (event) {
  if (event.key === 'Enter' && event.shiftKey) { // Cambiado para verificar Shift + Enter
    // Verificar si el slide 1 está visible
    if (document.getElementById('slide1').style.display !== 'none') {
      addNewWord(); // Agregar nueva palabra
    }
    // Verificar si el slide 2 está visible
    else if (document.getElementById('slide2').style.display !== 'none') {
      addNewWordFilters(); // Agregar nueva ubicación
    }
  }
});


document.getElementById("nameIdentifier").addEventListener("click", function () {
  // Obtener todos los textareas
  const textareas = document.querySelectorAll('#textareaWrapper textarea');

  // Encontrar el textarea actual basado en el currentMessageIndex
  const currentTextarea = textareas[currentMessageIndex];

  if (!currentTextarea) return; // Verificar si existe el textarea

  var startPos = currentTextarea.selectionStart;
  var endPos = currentTextarea.selectionEnd;
  var textBefore = currentTextarea.value.substring(0, startPos);
  var textAfter = currentTextarea.value.substring(endPos, currentTextarea.value.length);

  // Insertar el texto en la posición del cursor
  currentTextarea.value = textBefore + "[NOMBRE]" + textAfter;

  // Mover el cursor después del texto insertado
  var insertedTextLength = "[NOMBRE]".length;
  currentTextarea.selectionStart = currentTextarea.selectionEnd = startPos + insertedTextLength;

  // Actualizar el array de mensajes con el nuevo texto
  messageTexts[currentMessageIndex] = currentTextarea.value;

  // Enfocar el textarea y actualizar la UI
  currentTextarea.focus();
  updateMessagePreparedUI();
  updateMessagePreparedUI2();
});




document
  .getElementById("personalizationIdentifier")
  .addEventListener("click", function () {
    var inputElem = document.getElementById("messagePrepared");
    if (!inputElem) return; // Verifica si el elemento existe

    // Get the current value of the input
    var currentValue = inputElem.value;

    // Append the new text with line breaks and "&&" at the endf
    // inputElem.value = currentValue + "\n&&\nAQUÍ VA TU NUEVO MENSAJE";

    // Move the cursor to the end of the input
    inputElem.selectionStart = inputElem.selectionEnd = inputElem.value.length; // Move cursor to the end

    // Focus the input element to ensure the cursor is visible
    inputElem.focus();
    updateMessagePreparedUI();
  });

document.getElementById("csv_file").addEventListener("change", function () {
  countEmailsCorrect(this);
});

function randomDelay(minMinutes, maxMinutes) {
  const minMilliseconds = minMinutes * 60 * 1000;
  const maxMilliseconds = maxMinutes * 60 * 1000;
  return Math.random() * (maxMilliseconds - minMilliseconds) + minMilliseconds;
}

function delay(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}


async function stopMessagesInsta() {
  // update status bar
  enableRestarMessages();

  document.getElementById(
    "statusSpanSenders"
  ).textContent = `Status: Envío de mensajes pausados`;
  document.getElementById(
    "statusSpanSenders"
  ).style.background = `#FFFF00`;
  document.getElementById("statusSpanSenders").style.color = `#000000`;
  document.getElementById("cancelInstagramMessage6").style.display = 'block';
  document.getElementById("stopInstagramMessage").style.display = 'none';

  // disable enviar mensajes button
  disablePauseMessagesButton();
  enableSendMessagesButton();
  enableMessageEntry();

  stopMessages = true;
  messageSent = false;

  // destroy window
  chrome.windows.remove(windowMessagesId, function () {
    // Create a session object and make a sample request
  });

  windowMessagesId = null;
  linesToUse = [];

  // document.getElementById(
  //   "nextDateSendSpan"
  // ).textContent = `Mensajes pausados`;

  if (!isSending && !isInspectingAndSending) {
    // does not count for sending and inspection modes
    // let res = await HowerAPI.setReinspectIndex(
    //   howerUsername,
    //   howerToken,
    //   filenameMessagesSent,
    //   indexMessagesSent
    // );

    // filenameMessagesSent = "";
    indexMessagesSent = 0;
  }

  if (isSending) {
    newHeaders = undefined;
    openedTabId = undefined;
  }

  messageTexts = document.getElementById('messagePrepared').value.split("\n&&\n");
  await createCSVMessagesSent();
};

document
  .getElementById("stopInstagramMessage")
  .addEventListener("click", stopMessagesInsta);


document
  .getElementById("showTemplatesBtn")
  .addEventListener("click", showPopupSendersTemplates);


function toggleSentMessages() {
  var messages = document.getElementById("sentMessages");
  if (messages.style.display === "none") {
    messages.style.display = "block";
  } else {
    messages.style.display = "none";
  }
}

document
  .getElementById("resetAdvancedOptionsMessages")
  .addEventListener("click", function () {
    messageLimit = 20;
    messageTimeDelay = 5;
    shouldFollowFollowers = false;
    document.getElementById("messageLimitLabel").innerText = messageLimit;
    document.getElementById("messageLimitLabelPopup").innerText = messageLimit;
    document.getElementById("waitTimeLabel").innerText = messageTimeDelay;
    document.getElementById("messageLimit").value = messageLimit;
    document.getElementById("messageLimitPopup").value = messageLimit;
    document.getElementById("waitTime").value = messageTimeDelay;
    document.getElementById("followFollowersCheckbox").checked =
      document.getElementById("followFollowersCheckboxPopup").checked =
      shouldFollowFollowers;
  });


document
  .getElementById("resetAdvancedOptionsMessagesPopup")
  .addEventListener("click", function () {
    messageLimit = 20;
    messageTimeDelay = 5;
    shouldFollowFollowers = false;
    document.getElementById("messageLimitLabel").innerText = messageLimit;
    document.getElementById("messageLimitLabelPopup").innerText = messageLimit;
    document.getElementById("waitTimeLabel").innerText = messageTimeDelay;
    document.getElementById("messageLimit").value = messageLimit;
    document.getElementById("messageLimitPopup").value = messageLimit;
    document.getElementById("waitTime").value = messageTimeDelay;
    document.getElementById("followFollowersCheckbox").checked =
      document.getElementById("followFollowersCheckboxPopup").checked =
      shouldFollowFollowers;
  });

  function initializeTooltips() {
    const tooltipData = {
        'prospectByPost': {
            text: 'Contacta a personas que comentaron en un post específico',
            gif: 'https://s6.gifyu.com/images/bzZRV.gif',
            position: 'top'
        },
        'prospectByAccount': {
            text: 'Contacta a seguidores de una cuenta específica',
            gif: 'https://s6.gifyu.com/images/bzZgE.gif',
            position: 'top'
        },
        'emailPreparedPost' : {
            text: 'NOTA: El Post a usar debe tener 60+ comentarios para encontrar buenos prospectos!',
            gif: 'https://s6.gifyu.com/images/bzZRU.gif',
            position: 'bottom'
        },
        'showTemplatesBtn' : {
            text: 'Son plantillas YA PROBADAS por otros networkers exitosos en Hower',
            position: 'right'
        },
        'showSavedMessagesBtn' : {
            text: 'Aquí están todos los mensajes que has redactado antes en Hower!',
            position: 'right'
        },
        'addMessageBtn' : {
            text: 'Imagínate enviar el mismo mensaje a todos tus prospectos, da click y agrega un mensaje diferente a enviar!',
            position: 'right'
        },
        'nameIdentifier' : {
            text: 'Da click y se insertará [NOMBRE], esto será reemplazado automaticamente por el primer nombre de cada prospecto!',
            gif: 'https://s6.gifyu.com/images/bzZg3.gif',
            position: 'top'
        },
        'messageLimitPopup': {
            position: 'top',
            customHTML: `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 5px;">
                    <p style="margin: 0; font-weight: bold;">Mensajes por día: <span id="messageLimitLabelTooltip">20</span></p>
                    <div id="tandasInfoTooltip" style="margin-top: 10px; background-color: #f8f9fa; padding: 8px; border-radius: 5px; width: 100%;">
                        <p style="margin: 0; font-size: 12px; text-align: center; font-weight: bold;">Asi se enviarán tus mensajes:</p>
                        <div id="tanda1InfoTooltip" style="margin-top: 5px; font-size: 12px;"></div>
                        <div id="tanda2InfoTooltip" style="margin-top: 5px; font-size: 12px;"></div>
                        <div id="tanda3InfoTooltip" style="margin-top: 5px; font-size: 12px;"></div>
                        <p>¡Esto se hace automático para cuidar tu cuenta de Instagram!</p>
                        <p style="margin-top: 10px; font-size: 11px; color: #666; text-align: center;">
                            ⚠️ Para modificar tandas: <br>
                            Menú ☰ > Configuración > 👉 Tandas
                        </p>
                    </div>
                </div>
            `
        },
        'buttonPopupInfoStories' : {
          text: 'Envia mensajes a las historias',
          gif: 'https://s6.gifyu.com/images/bbXOU.gif',
          position: 'bottom'
        },
        'buttonPopupInfo' : {
          text: 'Sigue a los prospectos',
          gif: 'https://s6.gifyu.com/images/bzZj7.gif',
          position: 'bottom'
        },
        'buttonPopupInfo2' : {
          text: 'Sigue a los prospectos',
          gif: 'https://s6.gifyu.com/images/bzZj7.gif',
          position: 'bottom'
        },
        'missingVariablesContent' : {
          text: 'Las variables son textos en tus mensajes que debes de reemplazar. Verifica tus mensajes',
          gif: 'https://s6.gifyu.com/images/bzrP7.gif',
          position: 'top'
        },
        'continueButton' : {
          text: 'Al darle click, continuarás en automático el envío que dejaste pendiente! (NO SE REPETIRÁN CONVERSACIONES).',
          position: 'bottom'
        },
        'sendMessageStoriesCheckboxContainer' : {
          text: 'Envia mensajes a las historias',
          gif: 'https://s6.gifyu.com/images/bbXOU.gif',
          position: 'bottom'
        },
        'sendMessageToNewFollowersCheckboxContainer' : {
          text: '¡Prospecta a tus nuevos seguidores! (se prospectarán al inicio de tu prospección)',
          position: 'bottom'
        },
        'prospectLevelSlider' : {
          position: 'bottom',
          customHTML: `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 5px;">
                  <div id="levelsInfoTooltip" style="margin-top: 10px; background-color: #f8f9fa; padding: 8px; border-radius: 5px; width: 100%;">
                    <p style="margin: 0; font-size: 12px; text-align: center; font-weight: bold;">Prospectar a....</p>
                    <div id="level1InfoTooltip2" style="margin-top: 5px; font-size: 12px;">
                      Personas con 6 publicaciones y una foto de perfil puesta.
                    </div>
                    <div id="level2InfoTooltip2" style="margin-top: 5px; font-size: 12px; display: none;">
                      Personas con una foto de perfil, 6 (o más) publicaciones, y que tengan historias destacadas.
                    </div>
                    <div id="level3InfoTooltip2" style="margin-top: 5px; font-size: 12px; display: none;">
                      Personas con una foto de perfil, 6 (o más) publicaciones, que tengan historias destacadas, y una historia activa.
                    </div>
                   
                  </div>
                </div>
            `
        },
        'prospectLevelSlider2' : {
          position: 'bottom',
          customHTML: `
                <div style="display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 5px;">
                  <div id="levelsInfoTooltip" style="margin-top: 10px; background-color: #f8f9fa; padding: 8px; border-radius: 5px; width: 100%;">
                    <p style="margin: 0; font-size: 12px; text-align: center; font-weight: bold;">Prospectar a....</p>
                    <div id="level1InfoTooltip" style="margin-top: 5px; font-size: 12px;">
                      Personas con 6 publicaciones y una foto de perfil puesta.
                    </div>
                    <div id="level2InfoTooltip" style="margin-top: 5px; font-size: 12px; display: none;">
                      Personas con una foto de perfil, 6 (o más) publicaciones, y que tengan historias destacadas.
                    </div>
                    <div id="level3InfoTooltip" style="margin-top: 5px; font-size: 12px; display: none;">
                      Personas con una foto de perfil, 6 (o más) publicaciones, que tengan historias destacadas, y una historia activa.
                    </div>
                   
                  </div>
                </div>
            `
        }
    };

    let tooltipTimer;

    function positionTooltip(element, tooltip, position) {
        const elementRect = element.getBoundingClientRect();
        const tooltipRect = tooltip.getBoundingClientRect();

        switch(position) {
            case 'top':
                tooltip.style.left = elementRect.left + (elementRect.width/2) + 'px';
                tooltip.style.top = elementRect.top - 10 + 'px';
                break;
            case 'bottom':
                tooltip.style.left = elementRect.left + (elementRect.width/2) + 'px';
                tooltip.style.top = elementRect.bottom + 10 + 'px';
                break;
            case 'left':
                tooltip.style.left = elementRect.left - tooltipRect.width - 10 + 'px';
                tooltip.style.top = elementRect.top + (elementRect.height/2) + 'px';
                break;
            case 'right':
                tooltip.style.left = elementRect.right + 10 + 'px';
                tooltip.style.top = elementRect.top + (elementRect.height/2) + 'px';
                break;
        }
    }

    function updateTandasInfo(tooltip) {
      // Obtener información de las tandas
      const tanda1Element = document.querySelector('#tanda1 .mensajes-por-tanda');
      const tanda2Element = document.querySelector('#tanda2 .mensajes-por-tanda');
      const tanda3Element = document.querySelector('#tanda3 .mensajes-por-tanda');
      
      const tanda1Value = tanda1Element ? tanda1Element.textContent : '0';
      const tanda2Value = tanda2Element && window.getComputedStyle(document.getElementById('tanda2')).display !== 'none' ? tanda2Element.textContent : '0';
      const tanda3Value = tanda3Element && window.getComputedStyle(document.getElementById('tanda3')).display !== 'none' ? tanda3Element.textContent : '0';
      
      // Obtener horarios desde los selectores
      const tanda1Time = 'Ahora'; // La primera tanda siempre es "Ahora"
      
      // Para tanda 2, obtener el valor seleccionado del select
      let tanda2Time = '';
      const tanda2Select = document.querySelector('#tanda2 select');
      if (tanda2Select) {
          const selectedOption = tanda2Select.options[tanda2Select.selectedIndex];
          tanda2Time = selectedOption ? selectedOption.text : '';
      }
      
      // Para tanda 3, obtener el valor seleccionado del select
      let tanda3Time = '';
      const tanda3Select = document.querySelector('#tanda3 select');
      if (tanda3Select) {
          const selectedOption = tanda3Select.options[tanda3Select.selectedIndex];
          tanda3Time = selectedOption ? selectedOption.text : '';
      }
      
      // Actualizar información en el tooltip
      const tanda1Info = tooltip.querySelector('#tanda1InfoTooltip');
      const tanda2Info = tooltip.querySelector('#tanda2InfoTooltip');
      const tanda3Info = tooltip.querySelector('#tanda3InfoTooltip');
      
      tanda1Info.innerHTML = `<span style="font-weight: bold;">Tanda 1 (${tanda1Time}):</span> ${tanda1Value} mensajes`;
      
      if (tanda2Value !== '0' && window.getComputedStyle(document.getElementById('tanda2')).display !== 'none') {
          tanda2Info.innerHTML = `<span style="font-weight: bold;">Tanda 2 (${tanda2Time}):</span> ${tanda2Value} mensajes`;
          tanda2Info.style.display = 'block';
      } else {
          tanda2Info.style.display = 'none';
      }
      
      if (tanda3Value !== '0' && window.getComputedStyle(document.getElementById('tanda3')).display !== 'none') {
          tanda3Info.innerHTML = `<span style="font-weight: bold;">Tanda 3 (${tanda3Time}):</span> ${tanda3Value} mensajes`;
          tanda3Info.style.display = 'block';
      } else {
          tanda3Info.style.display = 'none';
      }
  }

    for (const [id, data] of Object.entries(tooltipData)) {
        const element = document.getElementById(id);
        if (element) {
            const tooltip = document.createElement('div');
            tooltip.className = 'dynamic-tooltip';
            tooltip.innerHTML = data.customHTML || `
                <p>${data.text}</p>
                ${data.gif ? `<img src="${data.gif}" alt="Tutorial">` : ''}
            `;
            document.body.appendChild(tooltip);

            element.addEventListener('mouseenter', () => {
                tooltipTimer = setTimeout(() => {
                    const position = data.position || 'top';
                    tooltip.classList.remove('top', 'bottom', 'left', 'right');
                    tooltip.classList.add(position);
                    positionTooltip(element, tooltip, position);
                    
                    // Si es el tooltip del messageLimit, actualizar información de tandas
                    if (id === 'messageLimitPopup') {
                        const tooltipLabel = tooltip.querySelector('#messageLimitLabelTooltip');
                        const originalInput = document.getElementById('messageLimitPopup');
                        
                        // Sincronizar valor inicial
                        tooltipLabel.textContent = originalInput.value;
                        
                        // Actualizar información de tandas
                        updateTandasInfo(tooltip);
                        
                        // Actualizar tandas cuando cambia el valor
                        originalInput.addEventListener('input', () => {
                            tooltipLabel.textContent = originalInput.value;
                            updateTandasInfo(tooltip);
                        });
                    } else if (id === "prospectLevelSlider2" || id === "prospectLevelSlider") {
                      // actualizar los niveles...
                        const prospectLevelSliderInput = document.getElementById('prospectLevelSlider2');
                        const prospectLevelSliderInputNormal = document.getElementById('prospectLevelSlider');

                        const level1Tooltip = document.getElementById('level1InfoTooltip');
                        const level1Tooltip2 = document.getElementById('level1InfoTooltip2');
                        const level2Tooltip = document.getElementById('level2InfoTooltip');
                        const level2Tooltip2 = document.getElementById('level2InfoTooltip2');
                        const level3Tooltip = document.getElementById('level3InfoTooltip');
                        const level3Tooltip2 = document.getElementById('level3InfoTooltip2');

                        prospectLevelSliderInput.addEventListener('input', function() {
                            
                          localStorage.setItem('savedLevelForContactingProspects', this.value);
                          const value = parseInt(this.value);

                          
                          updateSliderValue(value);

                          if (value === 1) {
                            // show first
                            level1Tooltip.style.display = 'block';
                            level2Tooltip.style.display = 'none';
                            level3Tooltip.style.display = 'none';
                          } else if (value === 2) {
                            // show second
                            level1Tooltip.style.display = 'none';
                            level2Tooltip.style.display = 'block';
                            level3Tooltip.style.display = 'none';
                          } else if (value === 3) {
                            // show second
                            level1Tooltip.style.display = 'none';
                            level2Tooltip.style.display = 'none';
                            level3Tooltip.style.display = 'block';
                          }
                      });

                      prospectLevelSliderInputNormal.addEventListener('input', function() {
                            
                            localStorage.setItem('savedLevelForContactingProspects', this.value);
                            const value = parseInt(this.value);

                            
                            updateSliderValue(value);

                            if (value === 1) {
                              // show first
                              level1Tooltip2.style.display = 'block';
                              level2Tooltip2.style.display = 'none';
                              level3Tooltip2.style.display = 'none';
                            } else if (value === 2) {
                              // show second
                              level1Tooltip2.style.display = 'none';
                              level2Tooltip2.style.display = 'block';
                              level3Tooltip2.style.display = 'none';
                            } else if (value === 3) {
                              // show second
                              level1Tooltip2.style.display = 'none';
                              level2Tooltip2.style.display = 'none';
                              level3Tooltip2.style.display = 'block';
                            }
                      });
                    }
                    
                    tooltip.classList.add('show');
                }, id === "prospectLevelSlider2" || id === "prospectLevelSlider" ? 0 : 600);
            });

            element.addEventListener('mouseleave', () => {
                clearTimeout(tooltipTimer);
                tooltip.classList.remove('show');
            });
        }
    }
}



document
  .getElementById("buttonPopupInfo")
  .addEventListener("click", function () {
    document.getElementById("infoPopup").style.display = "block";
  });


// document
//   .getElementById("buttonPopupInfoStories")
//   .addEventListener("click", function () {
//     document.getElementById("infoPopupStories").style.display = "block";
//   });


// document.getElementById("buttonPopupInfo2").addEventListener("click", function () {
//   document.getElementById("infoPopup2").style.display = "block";
// })

// document
//   .getElementById("buttonPopupInfoInspection")
//   .addEventListener("click", function () {
//     document.getElementById("infoPopupInspection").style.display = "block";
//   });

// document
//   .getElementById("buttonPopupInfo")
//   .addEventListener("click", closeInspectorsPopup);

document
  .getElementById("inspectionPopupMethod")
  .addEventListener("click", closeInspectorsPopup);

document
  .getElementById("closeInstagramMessagePopup")
  .addEventListener("click", closeInspectorsPopup);

document.getElementById('closeWrongFileButton').addEventListener("click", closeBadFilePopup);

function showInspectorsPopup() {
  document.getElementById("welcomePopupMethod").style.display = "block";
  document.getElementById("popupOverlayMethod").style.display = "block";
}

function showPopupBadFilePopup() {
  document.getElementById("welcomePopupBadFileMethod").style.display = "block";
  document.getElementById("popupOverlayBadFileMethod").style.display = "block";
  disableSendMessagesButton();
}

function showEnterMessagePopup() {
  document.getElementById("welcomePopupMethodMessagePopup").style.display =
    "block";
  document.getElementById("popupOverlayMethodMessagePopup").style.display =
    "block";
}

function closeBadFilePopup() {
  document.getElementById("welcomePopupBadFileMethod").style.display = "none";
  document.getElementById("popupOverlayBadFileMethod").style.display = "none";
}

function closeInspectorsPopup() {
  document.getElementById("welcomePopupMethod").style.display = "none";
  document.getElementById("popupOverlayMethod").style.display = "none";
  document.getElementById("welcomePopupMethodMessagePopup").style.display =
    "none";
  document.getElementById("popupOverlayMethodMessagePopup").style.display =
    "none";
}

document
  .getElementById("inspectionPopup")
  .addEventListener("click", async function () {
    document.getElementById("welcomePopup").style.display = "none";
    document.getElementById("popupOverlay").style.display = "none";

    var checkbox = document.getElementById("dontShowAgain");
    if (checkbox.checked) {
      await HowerAPI.changeUserConf(
        howerUsername,
        howerToken,
        "post_inspection_popup",
        false
      );
    }
  });

document
  .getElementById("inspectionPopupSendersTemplates")
  .addEventListener("click", function () {
    document.getElementById("welcomePopupSendersTemplates").style.display =
      "none";
    document.getElementById("popupOverlaySendersTemplates").style.display =
      "none";
  });

document
  .getElementById("inspectionPopupSenders")
  .addEventListener("click", async function () {
    document.getElementById("welcomePopupSenders").style.display = "none";
    document.getElementById("popupOverlaySenders").style.display = "none";

    var checkbox = document.getElementById("dontShowAgainSenders");
    if (checkbox.checked) {
      await HowerAPI.changeUserConf(
        howerUsername,
        howerToken,
        "instagram_sender_popup",
        false
      );
    }
  });

document
  .getElementById("buttonPopupInfoClose")
  .addEventListener("click", function () {
    document.getElementById("infoPopup").style.display = "none";
  });

  document
  .getElementById("buttonPopupInfoCloseStories")
  .addEventListener("click", function () {
    document.getElementById("infoPopupStories").style.display = "none";
  });

document
  .getElementById("buttonPopupInfoClose2")
  .addEventListener("click", function () {
    document.getElementById("infoPopup2").style.display = "none";
  });

document
  .getElementById("buttonPopupInfoCloseInspection")
  .addEventListener("click", function () {
    document.getElementById("infoPopupInspection").style.display = "none";
  });

async function showPopupPostInspection() {
  let profileConf = await HowerAPI.getProfileConf(howerUsername, howerToken);
  if (DEBUG) console.error("RESPUESTA DE LA CONF " + profileConf);

  if (
    typeof profileConf === "string" ||
    profileConf.post_inspection_popup === true
  ) {
    document.getElementById("welcomePopup").style.display = "block";
    document.getElementById("popupOverlay").style.display = "block";
  }
}


async function showPopupSendersTemplates() {
  document.getElementById("popupOverlaySendersTemplates").style.display = 'block';
  document.getElementById("welcomePopupSendersTemplates").style.display = 'block';
}

async function showPopupSendersNewUser() {
  document.getElementById("welcomePopupSenders").style.display =
    "block";
  document.getElementById("popupOverlaySenders").style.display =
    "block";

  const button = document.getElementById('inspectionPopupSenders');
  const timerDisplay = document.getElementById('countdownTimer');
  let timeLeft = 20;

  // Iniciar el contador
  const timer = setInterval(() => {
    timeLeft--;
    timerDisplay.textContent = timeLeft;
    button.textContent = `Entendido (${timeLeft}s)`;

    if (timeLeft <= 0) {
      clearInterval(timer);
      button.disabled = false;
      button.style.backgroundColor = '#4CAF50';
      button.style.cursor = 'pointer';
      button.textContent = 'Entendido';
    }
  }, 1000);
}


document.getElementById("inspectionPopupSenders").addEventListener("click", function () {
  document.getElementById("welcomePopupSenders").style.display =
    "none";
  document.getElementById("popupOverlaySenders").style.display =
    "none";
});

async function showPopupSenders() {
  let profileConf = await HowerAPI.getProfileConf(howerUsername, howerToken);
  if (DEBUG) console.error("RESPUESTA DE LA CONF " + profileConf);

  if (
    typeof profileConf === "string" ||
    profileConf.instagram_sender_popup === true
  ) {
    document.getElementById("welcomePopupSenders").style.display = "block";
    document.getElementById("popupOverlaySenders").style.display = "block";
  }
}

document.getElementById("followFollowersCheckboxPopup").addEventListener("change", function () {
  let checkbox = document.getElementById("followFollowersCheckbox");
  checkbox.checked = this.checked;
  checkbox.dispatchEvent(new Event('change'));
});


document.getElementById("saveMessagesCheckbox").addEventListener("change", function () {
  localStorage.setItem("saveMessages", this.checked);
});


document.getElementById("sendMessagesToPreviousConversationsCheckbox").addEventListener("change", function () {
  sendMessagesToPreviousConversations = this.checked;

  if (isSending && !this.checked) {
    // set the isOwnerPost to false in order to enable send messages 
    // if user wants to not sent to his prev
    // conversations to his/hers followers (IF ITS THE CASE!)
    isProspectingOwnerData = false; // then when sending message, 
                                    // will take the conf of the slider, which is false in this case!
  }
});

document
  .getElementById("followFollowersCheckbox")
  .addEventListener("change", function () {
    
    // Save the state to localStorage
    localStorage.setItem("followFollowersChecked", this.checked);

    let checkbox = document.getElementById("followFollowersCheckbox");
    let slider = document.getElementById("waitTime");
    let spanTimeDelay = document.getElementById("waitTimeLabel");
    let spanMessageLimit = document.getElementById("messageLimitLabel");
    let sliderMessageLimit = document.getElementById("messageLimit");

    if (checkbox.checked) {
      shouldFollowFollowers = true;
      if (DEBUG) console.error("Changed switch to true");

      slider.min = 5;
      sliderMessageLimit.max = MAX_MESSAGES_TO_SEND;

      if (messageTimeDelay < 5) {
        slider.value = 5;
        messageTimeDelay = 5;
        spanTimeDelay.textContent = messageTimeDelay;
      }

      if (messageLimit > sliderMessageLimit.max) {
        messageLimit = MAX_MESSAGES_TO_SEND;
        spanMessageLimit.textContent = messageLimit;
      }
    } else {
      slider.min = 4;
      sliderMessageLimit.max = MAX_MESSAGES_TO_SEND;

      shouldFollowFollowers = false;
      if (DEBUG) console.error("Changed switch to false");
    }

    document.getElementById("followFollowersCheckboxPopup").checked = this.checked;
  });



// Update the wait time label when the slider is moved
document.getElementById('waitTime').addEventListener('input', function () {
  localStorage.setItem("waitTime", this.value);
  document.getElementById('waitTimeLabel').innerText = this.value + ' minutos';

 // recalculateAllTandas();
 document.getElementById("messageLimit").dispatchEvent(new Event('input'));
});

async function showPopupOverlayAlertMessageTimeFrame() {
  // first check if the time between the last message and this one
  // also check the counter property on the last message
  // if counter == 30
  try {
    let data = await HowerAPI.getLatestCountMessages(howerUsername, howerToken);
    if (!data) {
      alert("Algo salió mal, inténtalo más tarde...");
      return;
    }

    let count = data.latest_count;
    let date = data.latest_date;
    let standardHours = data.standard_hours;
    let standardMessages = data.standard_messages;

    // if the difference of hours is greater than or equal to standardHours, then should show alert, else not
    const currentTime = new Date();
    const messageTime = new Date(date);
    const timeDifferenceInHours = (currentTime - messageTime) / (1000 * 60 * 60);

    const timeDifferenceInMilliseconds = currentTime - messageTime; // Diferencia en milisegundos
    const totalSeconds = Math.floor(timeDifferenceInMilliseconds / 1000); // Convertir a segundos
    const hoursRemaining = Math.floor(totalSeconds / 3600); // Calcular horas
    const minutesRemaining = Math.floor((totalSeconds % 3600) / 60); // Calcular minutos restantes

    if (DEBUG) console.error("COUNT " + count + " DATE " + date + " STANDARD HOURS " + standardHours + " STANDARD MESSAGES " + standardMessages + " TIME DIFFERENCE " + timeDifferenceInHours);

    if (timeDifferenceInHours < standardHours && count >= standardMessages) {
      // close the popups
      closePopupConfDisplay();
      closeNotification();

      const totalMinutes = (standardHours * 60) - Math.floor(totalSeconds / 60); // Total de minutos hasta alcanzar standardHours
      const minutesRemaining = totalMinutes % 60; // Minutos residuales

      document.getElementById("hoursTimeFrame").innerText = Math.floor(standardHours - timeDifferenceInHours);
      document.getElementById("minutesTimeFrame").innerText = minutesRemaining;// Mostrar minutos restantes

      // show the popup
      // stop the code in here for the user action on the popup
      document.getElementById('popupOverlayAlertMessageTimeFrame').style.display = 'block';
      document.getElementById('welcomePopupAIAlertMessageTimeFrame').style.display = 'block';

      // Await user action on the popup
      return await new Promise((resolve) => {
        // Assuming there are two buttons: buttonA and buttonB
        document.getElementById('understoodPopupOverlayAlertMessageTimeFrame').addEventListener('click', function closePopup() {
          // Hide the popup
          document.getElementById('popupOverlayAlertMessageTimeFrame').style.display = 'none';
          document.getElementById('welcomePopupAIAlertMessageTimeFrame').style.display = 'none';

          // Remove the event listener to prevent memory leaks
          this.removeEventListener('click', closePopup);

          // Resolve the promise with true
          resolve(false);
        });

        document.getElementById('closePopupOverlayAlertMessageTimeFrame').addEventListener('click', function closePopup() {
          // Hide the popup
          document.getElementById('popupOverlayAlertMessageTimeFrame').style.display = 'none';
          document.getElementById('welcomePopupAIAlertMessageTimeFrame').style.display = 'none';

          // Remove the event listener to prevent memory leaks
          this.removeEventListener('click', closePopup);

          // Resolve the promise with false
          resolve(true);
        });
      });
    }

    return true;
  } catch (e) {
    return false;
  }

  // validate current day vs the day in there
}

function showLoadingConfDisplay() {
  const button = document.getElementById('closeButtonConfDisplay');
  const buttonText = button.querySelector('.button-text');
  const spinner = button.querySelector('.loading-spinner');

  button.disabled = true;
  buttonText.textContent = 'Procesando...';
  spinner.style.display = 'block';
}

function hideLoadingConfDisplay() {
  const button = document.getElementById('closeButtonConfDisplay');
  const buttonText = button.querySelector('.button-text');
  const spinner = button.querySelector('.loading-spinner');

  button.disabled = false;
  buttonText.textContent = 'Entiendo';
  spinner.style.display = 'none';
}


document.getElementById("closeButtonConfDisplay").addEventListener("click", async function () {

  // check if the user is logged in
  closeNotification();
  showLoadingConfDisplay();

  if (!await instagramIsLoggedIn()) {
    closePopupConfDisplay();
    hideLoadingConfDisplay();

    // and then show the popup
    showWelcomePopupNewUpdateDetails("closeButtonConfDisplay");
    return;
  }

  closePopupConfDisplay();
  hideLoadingConfDisplay();

  // TODO:  Discomment over time

  // const result = await showPopupOverlayAlertMessageTimeFrame();
  // if (!result) {
  //   return;
  // }

  document.getElementById("cancelInstagramMessage6").style.display = 'none';
  document.getElementById("stopInstagramMessage").style.display = 'block';
  disableSendMessagesButton();
  disableRestartMessages();

  saveMessage();
  // save message

  document.getElementById(
    "statusSpanSenders"
  ).textContent = `Status: Sincronizado y Enviando mensajes. no cierres la ventana de Instagram!`;


  document.getElementById("statusSpanSenders").style.background =
    "linear-gradient(135deg, #9A7FFF, #D4C2FF)";
  document.getElementById("statusSpanSenders").style.color = `#FFFFFF`;
  requiresFileToContinue = false;


  await sendInstagramMessagePopupFunc(messageTexts.join("&&"));
});

document
  .getElementById("sendInstagramMessage")
  .addEventListener("click", function () {
    stopUpdateInterval();
    showPopupConfDisplay();
  });


remainingTime = 24 * 60 * 60; // 24 hours in seconds


function isNetworkerPanel() {
  return document.getElementById("emailSenderSidebar").style.display === "none";
}

function updateTimer() {
  // Calculate hours, minutes, and seconds
  let hours = Math.floor(remainingTime / 3600);
  let minutes = Math.floor((remainingTime % 3600) / 60);
  let seconds = remainingTime % 60;

  // Format time to always show two digits
  hours = hours.toString().padStart(2, "0");
  minutes = minutes.toString().padStart(2, "0");
  seconds = seconds.toString().padStart(2, "0");

  // Update the timer on the page
  document.getElementById(
    "statusSpanSenders"
  ).textContent = `Mensajes enviados por hoy, esperando ${hours}:${minutes}:${seconds} para reanudar el proceso`;

  // Decrease the remaining time by one second
  remainingTime--;

  // If time runs out, you can handle what happens next
  if (remainingTime < 0) {
    clearInterval(timerInterval);
    document.getElementById("statusMessage").textContent =
      "El proceso se reanudará ahora.";
  }
}


async function getMessagesSentFromFilename() {

  try {
    const match = filenameMessagesSent.match(/\/(p|reel)\/(.*?)(\/#|\/|$)/);

    let localFilenameMessagesSent = filenameMessagesSent;
    if (match && match.length > 1) {
      localFilenameMessagesSent = match[2];
    }

    let pivotFileName = localFilenameMessagesSent.replace(/\./g, "_");
    if (!isSending) {
      pivotFileName += "_fromfile";
    }

    let data = await HowerAPI.getUsersMessageSent(pivotFileName, howerUsername);
    if (!data) {
      return;
    }

    // for each fileObj in data, add the repetead messsages inside the set!
    for (const [key, value] of Object.entries(data)) {
      // Skip if value is a string
      if (typeof value === 'string') { continue; }

      if (value.hasOwnProperty('username')) {
        usersMessageSentSet.add(value['username']);
        messageUserMessageList[value['username']] = {};
        messageUserMessageList[value['username']]['message'] = value['message']; // Agregar mensaje al diccionario
        messageUserMessageList[value['username']]['time'] = value['time'];
        continue;
      }

      if (DEBUG) console.error("VALUE " + JSON.stringify(value));
      // If value is an object, iterate through its entries
      for (const [key2, value2] of Object.entries(value)) {
        if (value.hasOwnProperty(key2)) {
          // Si 'data[key]' es directamente un 'username'
          if (typeof value2 === 'string') {
            usersMessageSentSet.add(value2); // Agregar solo la parte antes de "_NOTSENT"
          }
          // Si 'data[key]' tiene propiedades 'username' y 'message'
          else if (value2.hasOwnProperty('username') && value2.hasOwnProperty('message')) {
            usersMessageSentSet.add(value2['username']); // Agregar solo la parte antes de "_NOTSENT"
            messageUserMessageList[value2['username']] = {};
            messageUserMessageList[value2['username']]['message'] = value2['message']; // Agregar mensaje al diccionario
            messageUserMessageList[value2['username']]['time'] = value2['time'];
          }
        }
      }

    }

    if (DEBUG) console.error("USERS MESSAGE SENT SET " + JSON.stringify(usersMessageSentSet));

  } catch (e) {
    if (DEBUG) console.error(e);
    if (DEBUG) console.error("USERS MESSAGE SENT SET " + JSON.stringify(usersMessageSentSet));
  }
}

function updateRestartMessage(timeStr) {
  // Obtener la hora actual
  const now = new Date();

  // Calcular la hora y los minutos actuales
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // Formatear la hora y los minutos para que siempre tengan dos dígitos
  const formattedHour = currentHour.toString().padStart(2, "0");
  const formattedMinutes = currentMinutes.toString().padStart(2, "0");

  // Generar el mensaje de estado con la hora de reinicio
  const messageEndingStatus = `Mensajes enviados por hoy, esperando ${timeStr} para continuar con el envío`;

  // Mostrar el mensaje en el elemento correspondiente
  document.getElementById('statusSpanSenders').textContent = messageEndingStatus;
}


function parseCustomDate(dateString) {
  const [datePart, timePart] = dateString.split(' ');
  const [day, month, year] = datePart.split('/').map(Number);
  const [hours, minutes, seconds] = timePart.split(':').map(Number);

  // Crear la fecha en el formato correcto, teniendo en cuenta que los meses en Date son base 0 (enero es 0)
  return new Date(`20${year}`, month - 1, day, hours, minutes, seconds);
}



function convertMillisecondsToTime(totalTimeDifference) {
  try {
    // Convertir milisegundos a segundos
    let totalSeconds = Math.floor(totalTimeDifference / 1000);

    // Calcular horas
    let hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600; // Restar las horas en segundos

    // Calcular minutos
    let minutes = Math.floor(totalSeconds / 60);

    // Calcular segundos
    let seconds = totalSeconds % 60;

    // Retornar el resultado en un formato de horas, minutos y segundos
    return `${hours}h ${minutes}m ${seconds}s`;
  } catch (e) {
    return "";
  }
}

async function isPrivateAccountFunc(username) {
  /**
   * Verifica si una cuenta de Instagram es privada.
   * 
   * @param {string} username - Nombre de usuario de Instagram.
   * @return {Promise<boolean|string>} - True si la cuenta es privada, False si no lo es, o un mensaje de error.
   */
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
    'X-IG-App-ID': '936619743392459',
    'Referer': `https://www.instagram.com/${username}/`
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (response.ok) {
      const data = await response.json();
      const isPrivate = data.data.user.is_private;
      return isPrivate; // Retorna True si la cuenta es privada, False si no lo es
    } else {
      return false;
    }
  } catch (error) {
    if (DEBUG) console.error(`[HOWER] - Error al hacer la solicitud para ${username} sobre cuenta privada! -> `, error);
    return false;
  }
}


async function accountIsBadProspect(username, keywords, keywordsExclude) {
  /**
     * Verifica si una cuenta de Instagram es privada o si no contienen las palabras clave dentro de keywords o bad keywords 
     * 
     * @param {string} username - Nombre de usuario de Instagram.
     * @return {Promise<boolean|string>} - True si la cuenta es privada, False si no lo es, o un mensaje de error.
     */
  const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36',
    'X-IG-App-ID': '936619743392459',
    'Referer': `https://www.instagram.com/${username}/`
  };

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: headers
    });

    if (response.ok) {
      const data = await response.json();
      if (DEBUG) console.error("ES MALA RESPUESTA" + JSON.stringify(data));
      const isPrivate = data.data.user.is_private;

      if (isPrivate) {
        return true;
      }

      if (keywords.length > 0) {
        // check for keywords in bio
        let includesKeyword = keywords.some(keyword => data.data.user.biography.toLowerCase().includes(keyword.toLowerCase()));
        if (includesKeyword) {
          return false;
        }

        includesKeyword = keywords.some(keyword => data.data.user.full_name.toLowerCase().includes(keyword.toLowerCase()));
        if (includesKeyword) {
          return false;
        }
      }

      if (keywordsExclude.length > 0) {
        // check for keywordsExclude in bio
        let includesKeyword = keywordsExclude.some(keyword => data.data.user.biography.toLowerCase().includes(keyword.toLowerCase()));
        if (includesKeyword) {
          return false;
        }

        includesKeyword = keywordsExclude.some(keyword => data.data.user.full_name.toLowerCase().includes(keyword.toLowerCase()));
        if (includesKeyword) {
          return false;
        }
      }

      // check if the account must be followed to be contacted!
      // if (!shouldFollowFollowers && !data.data.user?.is_business_account && !data.data.user?.is_professional_account) {
      //   return true;
      // }

      // doesnt have keyword filters
      return false
    } else {
      return false;
    }
  } catch (error) {
    if (DEBUG) console.error(`[HOWER] - Error al hacer la solicitud para ${username} sobre cuenta privada! -> `, error);
    return false;
  }
}

async function checkAllMetaTagsForKeywords(url, keywords) {
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error('Error fetching the page');
    }

    // Convertimos el HTML a texto
    const htmlText = await response.text();

    // Usamos DOMParser para analizar el HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');

    // Seleccionamos todas las etiquetas <meta> que tengan el atributo content
    const metaTagsWithContent = doc.querySelectorAll('meta[content]');
    console.log(metaTagsWithContent);

    // Iteramos sobre las etiquetas <meta> y verificamos si el contenido tiene alguna de las palabras clave
    for (let meta of metaTagsWithContent) {
      const contentValue = meta.getAttribute('content');
      console.log(contentValue);

      if (contentValue) {
        // Convertimos el contenido a minúsculas para comparaciones sin importar mayúsculas o minúsculas
        const lowerCaseContent = contentValue.toLowerCase();

        // Verificamos si alguna de las palabras clave está presente en el contenido
        const hasKeyword = keywords.some(keyword => lowerCaseContent.includes(keyword.toLowerCase()));

        if (hasKeyword) {
          console.log(`Palabra clave encontrada en meta content: ${contentValue}`);
          return true;
        }
      }
    }

    return false; // Ninguna palabra clave encontrada en los metatags
  } catch (error) {
    if (DEBUG) console.error('Error:', error);
    return false;
  }
}


function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitUntilNextDay(stopTime, totalTimeDifference) {
  while (true) {
    const currentTime = new Date();
    const targetTime = new Date(stopTime.getTime() + (1000 * 60 * 60 * 15 - totalTimeDifference)); // 15 hours from stopTime
    // const targetTime = new Date(stopTime.getTime() + (1000 * 60 * 3)); // 24 hours from stopTime

    console.log(`Current Time: ${currentTime}`);
    console.log(`Target Time: ${targetTime}`);

    const timeDifference = targetTime - currentTime;

    // Convert milliseconds to hours, minutes, and seconds
    const hours = Math.floor(timeDifference / (1000 * 60 * 60));
    const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

    document.getElementById("statusSpanSenders").textContent = `Mensajes enviados por hoy, esperando: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} horas para continuar`;

    if (currentTime >= targetTime) {
      console.log("24 hours have passed since stop time!");
      break; // Exit loop and continue with code
    } else {
      console.log("Still waiting...");
      await delay(1000); // Wait for 1 minute before checking again
    }
  }
}




document.getElementById('closePopupInspectorInstructions').addEventListener('click', closePopupInspectorInstructions);



// document.getElementById("message")

// let message1 = "Aquí aparecerá un ejemplo de mensaje";
// let message2 = "Aquí aparecerá un ejemplo de mensaje";
// let message3 = "Aquí aparecerá un ejemplo de mensaje";
// let message4 = "Aquí aparecerá un ejemplo de mensaje";
// let message5 = "Aquí aparecerá un ejemplo de mensaje";

// let currentPage = 0;

// // Function to show a message based on the current page
// function showMessage() {
//   if (currentPage === 0) {
//     document.getElementById('messageExample').textContent = message1;
//   } else if (currentPage === 1) {
//     document.getElementById('messageExample').textContent = message2;
//   } else if (currentPage === 2) {
//     document.getElementById('messageExample').textContent = message3;
//   } else if (currentPage === 3) {
//     document.getElementById('messageExample').textContent = message4;
//   } else if (currentPage === 4) {
//     document.getElementById('messageExample').textContent = message5;
//   }
// }


// document.getElementById("messagePopup0").addEventListener('input', () => {
//     let inputText = document.getElementById("messagePrepared0").value;

//     if (inputText === "") {
//       document.getElementById("messageExample").textContent = "Aqui aparecerá el mensaje con un ejemplo hacia un usuario";
//       message1 = "Aqui aparecerá el mensaje con un ejemplo hacia un usuario";
//       disableContinueMessage();
//       return;
//     }

//     enableContinueMessage();

//     let processedInput = inputText;

//     // .split(' ').map(word => {
//     //   // Break words longer than 20 characters
//     //   if (word.length > 30) {
//     //       return word.match(/.{1,20}/g).join(' ');
//     //   }
//     //   return word;
//     // }).join(' ');

//     // Replace occurrences of [NOMBRE] with 'Andres'
//     const updatedText = processedInput.replace(/\[NOMBRE\]/g, 'Andres');

//     // Update the content of the div
//     document.getElementById("messageExample2").textContent = inputText;
//     document.getElementById("messageExample").textContent = updatedText;
//     message1 = updatedText;
// });
// document.getElementById("messagePopup1").addEventListener('input', () => {
//   let inputText = document.getElementById("messagePrepared1").value;

//     if (inputText === "") {
//       message2 = "Aqui aparecerá el mensaje con un ejemplo hacia un usuario";
//       return;
//     }

//     let processedInput = inputText;

//     // .split(' ').map(word => {
//     //   // Break words longer than 20 characters
//     //   if (word.length > 30) {
//     //       return word.match(/.{1,20}/g).join(' ');
//     //   }
//     //   return word;
//     // }).join(' ');

//     // Replace occurrences of [NOMBRE] with 'Andres'
//     const updatedText = processedInput.replace(/\[NOMBRE\]/g, 'Andres');

//     // Update the content of the div
//     document.getElementById("messageExample2").textContent = inputText;
//     document.getElementById("messageExample").textContent = updatedText;
//     message2 = updatedText;
// });
// document.getElementById("messagePopup2").addEventListener('input', () => {
//   let inputText = document.getElementById("messagePrepared2").value;

//   if (inputText === "") {
//     message3 = "Aqui aparecerá el mensaje con un ejemplo hacia un usuario";
//     return;
//   }

//   let processedInput = inputText;

//   // .split(' ').map(word => {
//   //   // Break words longer than 20 characters
//   //   if (word.length > 30) {
//   //       return word.match(/.{1,20}/g).join(' ');
//   //   }
//   //   return word;
//   // }).join(' ');

//   // Replace occurrences of [NOMBRE] with 'Andres'
//   const updatedText = processedInput.replace(/\[NOMBRE\]/g, 'Andres');

//   // Update the content of the div
//   document.getElementById("messageExample2").textContent = inputText;
//   document.getElementById("messageExample").textContent = updatedText;
//   message3 = updatedText;
// });
// document.getElementById("messagePopup3").addEventListener('input', () => {
//   let inputText = document.getElementById("messagePrepared3").value;

//   if (inputText === "") {
//     message4 = "Aqui aparecerá el mensaje con un ejemplo hacia un usuario";
//     return;
//   }

//   let processedInput = inputText;

//   // .split(' ').map(word => {
//   //   // Break words longer than 20 characters
//   //   if (word.length > 30) {
//   //       return word.match(/.{1,20}/g).join(' ');
//   //   }
//   //   return word;
//   // }).join(' ');

//   // Replace occurrences of [NOMBRE] with 'Andres'
//   const updatedText = processedInput.replace(/\[NOMBRE\]/g, 'Andres');

//   // Update the content of the div
//   document.getElementById("messageExample2").textContent = inputText;
//   document.getElementById("messageExample").textContent = updatedText;
//   message4 = updatedText;
// });
// document.getElementById("messagePopup4").addEventListener('input', () => {
//   let inputText = document.getElementById("messagePrepared4").value;

//   if (inputText === "") {
//     message5 = "Aqui aparecerá el mensaje con un ejemplo hacia un usuario";
//     return;
//   }

//   let processedInput = inputText;

//   // .split(' ').map(word => {
//   //   // Break words longer than 20 characters
//   //   if (word.length > 30) {
//   //       return word.match(/.{1,20}/g).join(' ');
//   //   }
//   //   return word;
//   // }).join(' ');

//   // Replace occurrences of [NOMBRE] with 'Andres'
//   const updatedText = processedInput.replace(/\[NOMBRE\]/g, 'Andres');

//   // Update the content of the div
//   document.getElementById("messageExample2").textContent = inputText;
//   document.getElementById("messageExample").textContent = updatedText;
//   message5 = updatedText;
// });




// // Function to go to the next page
// function nextPage() {
//   if (currentPage < 5) {
//       currentPage++;
//       showMessage();
//   }
// }

// // Function to go to the previous page
// function prevPage() {
//   if (currentPage > 0) {
//       currentPage--;
//       showMessage();
//   }
// }

// document.getElementById('prevButton').addEventListener('click', prevPage);
// document.getElementById('nextButton').addEventListener('click', nextPage);


// showMessage();



// Example usage
async function startProcess(totalTimeDifference) {
  const stopTime = new Date(); // Simulate the time when the process stopped
  console.log(`Stop Time: ${stopTime}`);

  await waitUntilNextDay(stopTime, totalTimeDifference); // Wait until 24 hours have passed

  // Continue with the rest of your code after 24 hours have passed
  console.log("Process continues after 24 hours.");
}

document.getElementById("macInstructions").addEventListener("click", showMacInstructions);
document.getElementById("windowsInstructions").addEventListener("click", showMacInstructions);

function showMacInstructions() {
  window.open("https://www.howersoftware.io/clients/blog/avoid-suspension/", "blank");
}


function waitForDelay() {
  return new Promise((resolve) => {
    let counterTiming = 0;
    let interval = setInterval(() => {
      if (stopMessages === true || counterTiming >= 300) {
        clearInterval(interval); // Detiene el intervalo cuando se cumplen las condiciones
        resolve(); // Resuelve la promesa y continúa la ejecución del código
      }
      counterTiming++;
    }, 500); // 500 ms entre cada iteración
  });
}


function getCurrentDateTime() {
  return new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

var counterInternal = 0;
var linesToUse = [];

function delayStanding(ms, signal) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      resolve();
    }, ms);

    signal.addEventListener("abort", () => {
      clearTimeout(timeoutId);
      if (DEBUG) console.error("[HOWER] Timing abortado... delayStanding()");
      reject(new DOMException("AbortError", "AbortError"));
    });
  });
}


function delayRandom(minMs, maxMs, executeDelay = false) {
  const waitTime = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;

  if (executeDelay) {
    return new Promise(resolve => setTimeout(resolve, waitTime));
  }

  return waitTime;
}


function updateRadioStyles() {
  const radios = document.querySelectorAll('input[type="radio"]');
  radios.forEach(radio => {
    if (radio.checked) {
      radio.style.backgroundColor = '#7a60ff';
      radio.style.borderColor = '#7a60ff';
    } else {
      radio.style.backgroundColor = '';
      radio.style.borderColor = '#7a60ff';
    }
  });
}



async function checkIfAccountIsHealthy() {
  return { isHealthy: true, hoursToEnableSend: 0 };
}

// async function checkIfAccountIsHealthy() {
//   // get the timeframe of the last message sent
//   // check if counterMessagesent >= 50 && (lastMessageTimeDate - currMessageTimeDate ) > 3 hrs
//   let lastMessageTimeDate = await HowerAPI.getLatestMessageMetadata(howerUsername, howerToken);

//   if (!lastMessageTimeDate) {
//     return { isHealthy: true, hoursToEnableSend: 0 };
//   }

//   let lastDateSent = lastMessageTimeDate.latestDateTimeSent;
//   let lastCounterMessagesApropiatedSent = parseInt(lastMessageTimeDate.totalMessagesToSend);

//   lastDateSent = new Date(lastDateSent);
//   const currentDate = new Date();
//   const timeDifferenceInHours = (currentDate - lastDateSent) / (1000 * 60 * 60);

//   // if (lastCounterMessagesApropiatedSent >= 150 && timeDifferenceInHours <= 3) { // lastCounterMessagesApropiatedSent >= 150
//   //   debugConsoleLog("cuenta NO está en estado saludable!  -- Se detendrá el software");
//   //   // TODO: we can change the limit from 30 to X
//   //   // cannot send messages
//   //   return { isHealthy: false, hoursToEnableSend: Math.floor(3 - timeDifferenceInHours) };
//   // }

//   // si el tiempo es mayor a 3 horas, entonces reinicia a 0

//   if (timeDifferenceInHours > 3) {
//     debugConsoleLog("Se hará RESET de los mensajes generales enviados! - timeDifferenceInHours > 3");
//     await HowerAPI.resetLastestMessageMetadata(howerUsername, howerToken, currentDate);
//     // this will set the current date and will set the value to 0!
//   }

//   // it can send messages
//   return { isHealthy: true, hoursToEnableSend: 0 };
// }



function getMessagesLimitPerTanda(messageLimit) {
  // get the number of tandas in the document 
  let numTandas = parseInt(document.getElementById("numTandas").value);
  return Math.floor(messageLimit / numTandas);
}


function debugConsoleLog(message) {
  if (DEBUG) {
    console.error("[HOWER] - " + message)
  };
}


function getCalculatedTimePerTanda() {
  //const MIN_DELAY = parseInt(document.getElementById('waitTime').value) - 5; // minimum
  //const MAX_DELAY = parseInt(document.getElementById('waitTime').value) + 5; // maximum
  const AVG_DELAY = parseInt(document.getElementById('waitTime').value); // average between both bounds
  debugConsoleLog("Average time delay " + AVG_DELAY);
  const totalMinutes = getMessagesLimitPerTanda(messageLimit) * AVG_DELAY;
  return Math.floor(totalMinutes / 60);
}



function delayCounter(milliseconds) {
  return new Promise((resolve) => {
    const targetTime = new Date(Date.now() + milliseconds);
    const textOfStatusSpan = document.getElementById("statusSpanSenders").textContent;

    tandaIntervalId = setInterval(() => {
      const now = new Date();
      const timeLeft = targetTime - now;

      if (timeLeft <= 0) {
        clearInterval(tandaIntervalId);
        resolve();
        return;
      }

      // Opcional: Actualizar UI con el tiempo restante
      const hours = Math.floor(timeLeft / (1000 * 60 * 60));
      const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

      document.getElementById("statusSpanSenders").textContent = textOfStatusSpan.split(" Continuará en:")[0] + " Continuará en: " +
        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    }, 1000); // Actualizar cada segundo
  });
}


async function getListWithUsernamesAndNames(usernames) {
  // for each profle
  let listWithUsernamesAndNames = [];
  for (let username of usernames) {
    let profile = await getProfile(username);
    listWithUsernamesAndNames.push({ username: username, name: profile.name });
  }
  return listWithUsernamesAndNames;
}


async function sendInstagramDMMessages() {
  // restart vars
  document.getElementById('message').disabled = true;
  disableADownloadLink();

  if (isSending) {
    filenameMessagesSent = document.getElementById('emailPrepared').value; //replace(/\./g, "_");
  }

  counterMessagesWasNotSent = 0;
  counterMessagesNotFollowAllowed = 0;
  counterMessagesMessageButtonBan = 0;

  await getMessagesSentFromFilename();

  windowMessagesId = null;
  messageCounter = 0;
  let messageEndingStatus =
    "Mensajes enviados, espera respuestas y da seguimiento!";
  let colorEndingStatus = "#00E886";

  // if (lines.length === 0 && !isInspectingAndSending && !isSending) {
  //   // no file was loaded!
  //   alert("Carga un archivo antes de empezar a enviar mensajes!");
  //   return;
  // }

  if (DEBUG) console.error("[HOWER] - Antes de crear ventana -> [INSTAGRAM]");

  // const newWindow = await createWindow({
  //   url: chrome.runtime.getURL("popup.html"),
  //   type: "popup",
  //   width: 800,
  //   height: 600
  // });
  // if (DEBUG) console.error(`[HOWER] - Después de crear ventana -> [INSTAGRAM: ${newWindow.id}]`);
  const newWindow = await chrome.windows.create({
    url: chrome.runtime.getURL("popup.html"),
    type: 'popup',
    width: 800,  // Ancho deseado
    height: 600, // Alto deseado
    focused: false // La ventana no tomará el foco
  });
  if (DEBUG) console.error(`[HOWER] - Después de crear pestaña -> [INSTAGRAM: ${newWindow.id}]`);

  // messages sent in false to avoid loop strange behaviour
  messageSent = false;

  // configuration settings
  if (isInspectingAndSending || isSending) {
    // delay a bit such that the inspector can open the initial Chrome Window, and then close it, and therefore
    // when sending Instagram DM messages, the new tab is opened in the previous chrome instance
    if (DEBUG) console.error("[HOWER] - Start Delay -> (1000 * 60) / 2");
    let countCorrectLeadsFound = false;


    await delay((1000 * 60) / 2);
    let prevLinesLength = -1;
    
    while (true) {
      debugConsoleLog("Verificando si todo bien con los delay...");
      if (lines.length <= prevLinesLength) {
        break;
      }

      for (let user of lines) {
        // get username of each user first!
        let username = user.split(/[,;]/)[usernameIndex];

        // check if username exists!
        if (!usersMessageSentSet.has(username) && !usersMessageSentSet.has(username + "_NOTSENT")) { // and check if for username + "_NOTSENT"
          // we can now proceed to send messages!!!
          countCorrectLeadsFound++;
        }
      }

      prevLinesLength = lines.length;

      if (countCorrectLeadsFound >= 3) {
        break;
      }


      await delay(1000 * 6); // waits half a minutes
      if (DEBUG) console.error("[HOWER] - Still searching leads...");
    }

    if (DEBUG) console.error("[HOWER] - End Delay -> (1000 * 60) / 2");

  } else {
    // make sure to check if the inspection is there in database
    // indexMessagesSent = await HowerAPI.getReinspectIndexflu(
    //   howerUsername,
    //   howerToken,
    //   filenameMessagesSent
    // );

    // if (indexMessagesSent === -1) {
    //   indexMessagesSent++; // new message sending!
    // }
    indexMessagesSent = 0;

  }

  document.getElementById(
    "statusSpanSenders"
  ).textContent = `Status: Mandando mensajes, no cierres y mantén activa la nueva ventana de instagram de Chrome!`;
  document.getElementById("statusSpanSenders").style.backgroundColor =
    "#7a60ff";
  document.getElementById("statusSpanSenders").style.color = `#FFFFFF`;

  disableSendMessagesButton();

  stopMessages = false;

  // select which list are the messages going to be sent to

  linesToUse = [];
  let checkbox = document.getElementById("followFollowersCheckbox");

  if (checkbox.checked) {
    // select the full list
    linesToUse = lines;
  } else {
    linesToUse = lines_business;
  }


  if (DEBUG) console.error("[HOWER] - Lineas a enviar mensajes correctamente cargadas");

  // AQUI ESTA


  const windowId = newWindow.id;
  windowMessagesId = windowId; // this for enabling the stop messages destroy the window

  console.log("New window created with ID:", windowId);

  // Get the ID of the first tab in the new window
  let instaTab = newWindow;
  if (newWindow.tabs && newWindow.tabs.length > 0) {
    instaTab = newWindow.tabs[0];
  }

  // let instaTab = await chrome.tabs.create({ url: 'https://www.instagram.com/' });

  if (isInspectingAndSending || isSending) {
    // TODO: update html of senders to appear as Synchronized!!

    document.getElementById(
      "statusSpanSenders"
    ).textContent = `Status: Sincronizado, Inspeccionando y Enviando mensajes.`;
    if (isSending) {
      document.getElementById(
        "statusSpanSenders"
      ).textContent = `Status: Sincronizado y Enviando mensajes. no cierres la ventana de Instagram!.`;
    }

    document.getElementById("statusSpanSenders").style.background =
      "linear-gradient(135deg, #9A7FFF, #D4C2FF)";
    document.getElementById("statusSpanSenders").style.color = `#FFFFFF`;
  }
  let randomTime = (1000 * 60) / 2;

  while (indexMessagesSent < linesToUse.length) {
    try {

      // validation of total messages sent in a timeframe of 3 hrs
      try {
        let res = await checkIfAccountIsHealthy();
        if (!res.isHealthy) {
          // alert popup and stop messages
          stopMessages = true;

          currentTanda = 1;
          const now = new Date();
          const hoursToWait = res.hoursToEnableSend;

          // Configurar nueva primera tanda 3 horas después
          const firstTandaTime = new Date(now.getTime() + (hoursToWait * 60 * 60 * 1000));

          // Obtener todos los selectores de horario
          const horarioSelects = document.querySelectorAll('.horario-select');

          // Para cada tanda (1-3)
          horarioSelects.forEach((select, index) => {
            // Calcular el tiempo para esta tanda
            const tandaTime = new Date(firstTandaTime.getTime() + (index * 3 * 60 * 60 * 1000));
            const hours = tandaTime.getHours().toString().padStart(2, '0');
            const minutes = tandaTime.getMinutes().toString().padStart(2, '0');

            // Crear nueva opción con el horario calculado
            const option = document.createElement('option');
            option.value = `${hours}:${minutes}`;
            option.text = `${hours}:${minutes}${tandaTime.getDate() !== now.getDate() ? ' (mañana)' : ''}`;

            // Limpiar opciones existentes y agregar la nueva
            select.innerHTML = '';
            select.appendChild(option);

            // Guardar en selectedTandaTimes
            selectedTandaTimes[`tanda${index + 1}`] = `${hours}:${minutes}`;
          });

          // Crear CSV de mensajes enviados
          await createCSVMessagesSent();

          const waitTime = firstTandaTime - now;
          if (DEBUG) console.error("[HOWER] Esperando " + waitTime.toString() + " milisegundos");

          // Actualizar UI para mostrar espera
          document.getElementById("statusSpanSenders").textContent =
            `Esperando hasta las ${selectedTandaTimes.tanda1} para iniciar siguiente tanda`;
          document.getElementById("statusSpanSenders").style.background = "#FFA500";

          chrome.windows.remove(windowMessagesId, function () {
            // Create a session object and make a sample request
          });


          // Esperar hasta la hora de la primera tanda
          await delayCounter(waitTime);

          const newWindow = await chrome.windows.create({
            url: chrome.runtime.getURL("popup.html"),
            type: 'popup',
            width: 800,
            height: 600,
            focused: false
          });
          windowMessagesId = newWindow.id;
          instaTab = newWindow;
          if (newWindow.tabs && newWindow.tabs.length > 0) {
            instaTab = newWindow.tabs[0];
          }

          // Reiniciar para nueva tanda
          stopMessages = false;
          const tableBodyValidation = document.getElementById("sentMessagesTableBody");
          while (tableBodyValidation.rows.length > 0) {
            tableBodyValidation.deleteRow(0);
          }

          // Actualizar UI para nueva tanda
          document.getElementById("statusSpanSenders").textContent =
            `Status: Iniciando tanda ${currentTanda} de mensajes`;
          document.getElementById("statusSpanSenders").style.background =
            "linear-gradient(135deg, #9A7FFF, #D4C2FF)";

          // show popup
          // document.getElementById("hoursTimeFrame").innerText = res.hoursToEnableSend;
          // // here it should say that we should wait 3 hours!!
          // document.getElementById("popupOverlayAlertMessageTimeFrame").style.display = 'block';
          // document.getElementById("welcomePopupAIAlertMessageTimeFrame").style.display = 'block';
        }
      } catch (e) {
        if (DEBUG) console.error("[HOWER] - Error al checar si la cuenta es saludable!!" + e.toString());
      }

      if (DEBUG) console.error("[HOWER] - Iniciando bucle!!");
      if (DEBUG) console.error(`[HOWER] - Verificando ventana [WINDOW:${windowMessagesId}]`);
      const windowCheck = await chrome.windows.get(windowMessagesId);
      if (!windowCheck) {
        if (DEBUG) console.error(`[HOWER:ERROR] - Ventana NO EXISTE!! [WINDOW:${windowMessagesId}]`);

        throw new Error("Window closed");
      }
      // const tabCheck = await chrome.tabs.get(windowMessagesId);
      // if (!tabCheck) {
      //   if (DEBUG) console.error(`[HOWER:ERROR] - Pestaña NO EXISTE!! [TAB:${windowMessagesId}]`);

      //   throw new Error("Tab closed");
      // }

      unfocusWindow(windowMessagesId);


      // unfocusWindow(windowMessagesId);
      // setTimeout(() => {
      //   unfocusWindow(windowMessagesId);
      // }, 5000);
    } catch (error) {
      if (stopMessages) {
        await delay(1000); // Wait for 1 second before checking again
        return;
      }
      if (DEBUG) console.error(`[HOWER:ERROR] - Creando nueva ventana [WINDOW:No hay ID}]`);
      const newWindow = await createWindow({
        url: chrome.runtime.getURL("popup.html"),
        type: "popup",
        width: 800,
        height: 600,
      });
      const newWindowId = newWindow.id;
      windowMessagesId = newWindowId; // update window ID
      if (DEBUG) console.error(`[HOWER:ERROR] - Nueva ventana creada [WINDOW:${windowMessagesId}}]`);
      // const newWindow = await chrome.tabs.create({
      //   url: chrome.runtime.getURL("popup.html"),
      //   active: false
      // });
      // const newWindowId = newWindow.id;
      // windowMessagesId = newWindowId; // update tab ID
      // if (DEBUG) console.error(`[HOWER:ERROR] - Nueva pestaña creada [TAB:${windowMessagesId}}]`);

      instaTab = newWindow;

      if (newWindow.tabs && newWindow.tabs.length > 0) {
        instaTab = newWindow.tabs[0];
      }

      // setTimeout(() => {
      //   unfocusWindow(windowMessagesId);
      // }, 5000);

      continue; // restart the loop to ensure the new window is ready
    }

    const tableBodyValidation = document.getElementById("sentMessagesTableBody");
    const rows = tableBodyValidation.getElementsByTagName("tr");
    // console.error(rows);
    // console.error("MESSAGE LIMIT " + messageLimit.toString());
    // console.error("NUM TANDAS LIMIT " + document.getElementById('numTandas').value);

    if (stopMessages === true) {
      if (DEBUG) console.error(`[HOWER] - Mensajes Detenidos!! [WINDOW:${windowMessagesId}}]`);
      try {
        if (DEBUG) console.error(`[HOWER] - Borrando Ventana - Mensajes Detenidos... [WINDOW:${windowMessagesId}}]`);
        // chrome.windows.remove(windowMessagesId, function () {
        //   // Create a session object and make a sample request
        // });
        chrome.windows.remove(windowMessagesId, function () {
          // callback
        });
        if (DEBUG) console.error(`[HOWER] - Ventana borrada - Mensajes Detenidos... [WINDOW]`);

      } catch (e) {
        if (DEBUG) console.error(`[HOWER:ERROR] - Hubo algún error al borrar ventana - Mensajes detenidos [WINDOW] - ${e.toString()}`);
      } finally {
        if (DEBUG) console.error(`[HOWER] - Saliendo de sendInstagramDMMessages() - Mensajes detenidos [WINDOW]`);

        return; // stopped instance
      }
    } else if (rows.length >= Math.floor(messageLimit / parseInt(document.getElementById('numTandas').value))) {
      
      let resOfDivision = messageLimit % parseInt(document.getElementById('numTandas').value);
      if (cicledInside < 5) {
        if (currentTanda === 1 && (rows.length < (Math.floor(messageLimit / parseInt(document.getElementById('numTandas').value)) + resOfDivision))) {
          debugConsoleLog("Tanda 1 aun le falta por completar... es el residuo... continuando...")
          cicledInside ++;
          continue;
        }
      }

      cicledInside = 0;
      
      if (DEBUG) console.error(`[HOWER] - Tanda ${currentTanda} completada. Mensajes enviados: ${rows.length}`);

      // Verificar si hay más tandas pendientes
      // Hay más tandas, preparar para la siguiente
      currentTanda++;
      let tandaRestarted = false;

      if (currentTanda > parseInt(document.getElementById('numTandas').value)) {
        tandaRestarted = true;
        currentTanda = 1;
      }

      // check if even if the numTandas is that value, we have the times inside the selectedTandaTimes
      if (selectedTandaTimes[`tanda${currentTanda}`] === null || selectedTandaTimes[`tanda${currentTanda}`] === undefined) {
        // continue since we dont have times avaiables
        continue;
      }
      // reset the counter of current tanda if overlaped
      tandaMessagesSent = 0;

      // Obtener el tiempo de inicio de la siguiente tanda
      let nextTandaTime = selectedTandaTimes[`tanda${currentTanda}`];
      const currentTime = new Date();
      // const targetTime = new Date(currentTime.getTime() + (5 * 60 * 1000)); // Set to 5 minutes after current time
      const targetTime = new Date();
      const [hours, minutes] = nextTandaTime.split(':').map(Number);
      targetTime.setHours(hours, minutes, 0, 0);

      let waitTime = targetTime - currentTime;

      debugConsoleLog("TARGET TIME " + targetTime);
      debugConsoleLog("CURRENT TIME " + currentTime);

      // Si el tiempo objetivo ya pasó, establecerlo para mañana
      if (targetTime <= currentTime || nextTandaTime.includes('(al día siguiente)')) {
        // await createCSVMessagesSent();
        // if ((getMessagesLimitPerTanda(messageLimit) - (rows.length)) <= 5 && (getMessagesLimitPerTanda(messageLimit) - (rows.length)) > 0) {
        //   // si la cantidad de mensajes enviados supera más de 2/3 de los mensajes enviados, entonces vamos a espera , de lo contrario enviar!

        //   if (DEBUG) console.error("[HOWER] - Tiempo objetivo ya paso! - Iniciando siguiente tanda, posible suspensión por parte del usuario en envío de mensajes previos");
        //   stopMessages = false;
        //   while (rows.length > 0) {
        //     tableBodyValidation.deleteRow(0);
        //   }

        //   // Actualizar UI para nueva tanda
        //   document.getElementById("statusSpanSenders").textContent =
        //     `Status: Iniciando tanda ${currentTanda} de mensajes`;
        //   document.getElementById("statusSpanSenders").style.background =
        //     "linear-gradient(135deg, #9A7FFF, #D4C2FF)";
        //   document.getElementById("messageTotalSentCounter").innerText = 0;
        //   continue;
        // } 

        console.error("ESTAMOS ENTRANDOAQUI ");

        if (tandaRestarted) {
          // if tanda is restarted, we need to set the await time to the
          // next day at that hour
          debugConsoleLog("Seteando el delay al de la primera tanda, se reinició.....");
          // targetTime.setDate(targetTime.getDate() + 1); // Move to the next day
          // waitTime = targetTime - currentTime; // Recalculate wait time
          waitTime = 10 * 60 * 60 * 1000; // 10 horas

          // Obtener hora actual
          const now = new Date();

          // Calcular nueva hora para tanda1 (10 horas después)
          const tanda1Time = new Date(now.getTime() + waitTime);

          // Calcular horas para tanda2 (3 horas después de tanda1)
          const tanda2Time = new Date(tanda1Time.getTime() + (3 * 60 * 60 * 1000));

          // Calcular horas para tanda3 (3 horas después de tanda2)
          const tanda3Time = new Date(tanda2Time.getTime() + (3 * 60 * 60 * 1000));

          // Actualizar los selects
          const tandaTimes = [tanda1Time, tanda2Time, tanda3Time];
          tandaTimes.forEach((time, index) => {
            const select = document.querySelector(`#tanda${index + 1} .horario-select`);
            if (select) {
              const hours = time.getHours().toString().padStart(2, '0');
              const minutes = time.getMinutes().toString().padStart(2, '0');
              const newTime = `${hours}:${minutes}`;

              // Limpiar opciones existentes
              select.innerHTML = '';

              // Crear y agregar nueva opción
              const option = document.createElement('option');
              option.value = newTime;
              option.text = `${newTime}${time.getDate() !== now.getDate() ? ' (mañana)' : ''}`;
              select.appendChild(option);

              // Actualizar selectedTandaTimes
              selectedTandaTimes[`tanda${index + 1}`] = newTime;
            }
          });
        } else {

          // aqui me gustaria que agregaras 3 horas al tiempo a waitTime, y a los tiempos de las tandas, y a los select de la interfaz
          // de los tiempos de tanda!!
          // tambien vamos a 
          // Agregar 3 horas a waitTime y actualizar tandas
          const threeHoursInMs = 3 * 60 * 60 * 1000; // 3 horas en milisegundos
          waitTime = threeHoursInMs// Date.now() + threeHoursInMs;

          debugConsoleLog("Tiempo calculado para siguiente tanda " + waitTime);



          // Obtener hora y minutos actuales
          const now = new Date();
          const currentHour = now.getHours();
          const currentMinutes = now.getMinutes();

          // Sumar 3 horas al tiempo actual
          let newHour = currentHour + 3;
          debugConsoleLog("NUEVA HORA A USAR " + newHour + ":" + currentMinutes)

          // Ajustar si pasa de las 24 horas
          if (newHour >= 24) {
            newHour = newHour - 24;
            debugConsoleLog("ENTRANDO A LA DIFERENCIA " + newHour + ":" + currentMinutes);
          }



          // Formatear el nuevo tiempo
          const newTimeStr = `${String(newHour).padStart(2, '0')}:${String(currentMinutes).padStart(2, '0')}`;
          debugConsoleLog("Nuevo tiempo para currentTandaSelect: " + newTimeStr);
          nextTandaTime = newTimeStr;

          // Actualizar la tanda actual con el nuevo tiempo
          debugConsoleLog("Current tanda : tanda" + currentTanda);
          const currentTandaSelect = document.querySelector(`#tanda${currentTanda} .horario-select`);
          if (currentTandaSelect) {
            currentTandaSelect.value = newTimeStr;
            selectedTandaTimes[`tanda${currentTanda}`] = newTimeStr;
            debugConsoleLog("Current tanda select actualizado: " + newTimeStr);
          }

          // Actualizar las tandas siguientes agregando 3 horas sucesivamente

          let counterTandaTemp = 1;
          // Convertir un tiempo en formato "HH:MM" a minutos desde la medianoche
          function timeToMinutes(timeStr) {
            const [hours, minutes] = timeStr.split(':').map(Number);
            return hours * 60 + minutes;
          }

          // Calcular la diferencia en minutos entre newTimeStr y el tiempo actual de la tanda
          const currentTandaTime = selectedTandaTimes[`tanda${currentTanda}`];
          const newTimeMinutes = timeToMinutes(newTimeStr);
          const currentTandaMinutes = timeToMinutes(currentTandaTime);
          const timeDifferenceTemp = newTimeMinutes - currentTandaMinutes;

          // Aplicar la diferencia a los otros elementos de selectedTandaTimes
          while (counterTandaTemp <= MAX_NUM_TANDAS_ENABLED) {
            const nextTandaSelect = document.querySelector(`#tanda${counterTandaTemp} .horario-select`);

            if (nextTandaSelect && (counterTandaTemp != currentTanda)) {
              let numTandas = parseInt(document.getElementById("numTandas").value);
              let hoursBetweenTanda = 3;
              if (numTandas === 4) {
                hoursBetweenTanda = 2;
              }

              const hoursToAdd = hoursBetweenTanda * counterTandaTemp + getCalculatedTimePerTanda();
              let newHour = currentHour + hoursToAdd;

              // Ajustar si pasa a otro día
              if (newHour >= 24) {
                newHour = newHour - 24;
              }

              // Calcular el nuevo tiempo ajustado con la diferencia
              let newMinutes = currentMinutes + timeDifferenceTemp;
              if (newMinutes >= 60) {
                newHour += Math.floor(newMinutes / 60);
                newMinutes = newMinutes % 60;
              }

              if (newHour >= 24) {
                newHour = newHour - 24;
              }

              const newTime = `${String(newHour).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
              nextTandaSelect.value = newTime;
              selectedTandaTimes[`tanda${counterTandaTemp}`] = newTime;
              debugConsoleLog("Nuevo tiempo para tanda " + counterTandaTemp + " TIEMPO: " + newTime);
            }
            counterTandaTemp++;
          }
          // actualizar las tandas anteriores
          debugConsoleLog("Current tanda times " + JSON.stringify(selectedTandaTimes));
        }


      }

      if (DEBUG) console.error(`[HOWER] - Esperando hasta ${nextTandaTime} para iniciar tanda ${currentTanda}`);

      // Actualizar UI
      messageEndingStatus = `Tanda ${(currentTanda - 1) === 0 ? 1 : (currentTanda - 1)} completada.`;
      document.getElementById("statusSpanSenders").textContent = messageEndingStatus;
      document.getElementById("statusSpanSenders").style.background = "#FFA500";

      // Esperar hasta la hora de la siguiente tanda

      if (DEBUG) console.error("[HOWER] Esperando " + waitTime.toString() + " mlisegundos");

      // close window
      chrome.windows.remove(windowMessagesId, function () {
        // Create a session object and make a sample request
      });

      // create .csv of messages sent
      await createCSVMessagesSent();


      // await some time
      await delayCounter(waitTime);

      debugConsoleLog("SALIENDO DE EL TIEMPO DE ESPERA!!");

      const newWindow = await chrome.windows.create({
        url: chrome.runtime.getURL("popup.html"),
        type: 'popup',
        width: 800,
        height: 600,
        focused: false
      });
      windowMessagesId = newWindow.id;
      instaTab = newWindow;
      if (newWindow.tabs && newWindow.tabs.length > 0) {
        instaTab = newWindow.tabs[0];
      }

      // Reiniciar para nueva tanda
      stopMessages = false;
      while (rows.length > 0) {
        tableBodyValidation.deleteRow(0);
      }

      // Actualizar UI para nueva tanda
      document.getElementById("statusSpanSenders").textContent =
        `Status: Iniciando tanda ${currentTanda} de mensajes`;
      document.getElementById("statusSpanSenders").style.background =
        "linear-gradient(135deg, #9A7FFF, #D4C2FF)";
      document.getElementById("messageTotalSentCounter").innerText = 0;

      // clear the interval
      clearInterval(tandaIntervalId);

      continue; // Continuar con la siguiente tanda

    } else if (counterMessagesWasNotSent >= LIMIT_MESSAGES_UNTIL_BAN) {
      // stop the messages and notify the user
      if (DEBUG) console.error(`[HOWER] - counterMessagesWasNotSent >= LIMIT_MESSAGES_UNTIL_BAN = TRUE... [WINDOW]`);
      await stopMessagesInsta();
      if (DEBUG) console.error(`[HOWER] - Deteniendo mensajes (counterMessagesWasNotSent >= LIMIT_MESSAGES_UNTIL_BAN)... [WINDOW]`);

      return;
    }

    cicledInside = 0;


    document.getElementById(
      "statusSpanSenders"
    ).textContent = `Status: Sincronizado y Enviando mensajes. no cierres la ventana de Instagram!`;

    
    try {
      if (indexMessagesSent >= linesToUse.length) {
        // we have finished the list
        if (DEBUG) console.error(`[HOWER] - indexMessagesSent >= linesToUse.length = TRUE... [WINDOW]`);
        if (DEBUG) console.error(`[HOWER] - Saliendo del bucle y finalizando (indexMessagesSent >= linesToUse.length) [WINDOW]`);
        break;
      }

      if (shouldSendMessageToNewFollowers && indexMessagesSent === 0) {
        // validate for the inspecting followers 
        document.getElementById('loadingFollowersOverlay').style.display = 'block';
        document.getElementById('loadingFollowersPopup').style.display = 'flex';
       try {      
         // open the chrome window inside the user profile
         await chrome.tabs.update(instaTab.id, {
           url: `https://www.instagram.com/hower.ai/`,
         });
 
         await new Promise(resolve => {
           chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
             if (tabId === instaTab.id && info.status === 'complete') {
               chrome.tabs.onUpdated.removeListener(listener);
               resolve();
             }
           });
         });
 
         // this will get me the list of new followers
        const responseListFollowers = chrome.tabs.sendMessage(instaTab.id, {
          action: "listNewFollowers",
          instaTabId: instaTab.id,
          windowId: windowMessagesId,
        });

        
  
        } catch (error) {
          if (DEBUG) console.error(`[HOWER:ERROR] - Error al obtener lista de nuevos seguidores -> ${error.toString()} - [WINDOW:${windowMessagesId}]`);
        }
        
        let timeLimitForNewFollowers = 60;
        let counter = 0;
        while (counter < timeLimitForNewFollowers) {
          // await 1 second per each loop and check
          await delay(1000);
          counter++;
          if (listNewFollowers.length > 0) {
            break;
          }
        }
    
        // deactivate popup
        document.getElementById('loadingFollowersOverlay').style.display = 'none';
        document.getElementById('loadingFollowersPopup').style.display = 'none';
 
        // add the listNewFollowwers to the messagesToSendNewFollowers
        // remove repeated strings inside the list
        listNewFollowers = [...new Set(listNewFollowers)];
        linesToUse = [...listNewFollowers, ...linesToUse];
      }
    } catch (e) {
      debugConsoleLog("No se pudo enviar o validar el mandar mensajes a nuevos seguidores! " + e.toString());
    }
    
     


    // get the user
    let user = linesToUse[indexMessagesSent];

    let username = "";
    try {
      username = user.split(/[,;]/)[usernameIndex];
      if (DEBUG) console.error(`[HOWER] - Username Obtenido -> ${username} [WINDOW:${windowMessagesId}]`);
    } catch (e) {
      username = "";
      console.error(`[HOWER:ERROR] - Username NO SE PUDO OBTENER -> ${username} [WINDOW:${windowMessagesId}] + ERROR: ${e.toString()}}`);
    }

    indexMessagesSent += 1;
    let keywordArray = [];
    let keywordArrayExclude = [];
    try {
      if (!username) {
        if (DEBUG) console.error(`[HOWER] - NO HAY NOMBRE DE USUARIO VALIDO - Esperando (1 minuto) - [WINDOW:${windowMessagesId}]`);
        if (isInspectingAndSending || isSending) {
          // await delay(1000); // await 1 second, and continue to next user!
          continue;
        }
        // means no user is left!
        break;
      }

      username = username.replace(/"/g, ""); // hasta aqui, tenemos username
      if (DEBUG) console.error(`[HOWER] - Username CLEANED - ${username} [WINDOW:${windowMessagesId}]`);

      // check si es buen usuario
      let personalization = "";
      try {
        if (usersMessageSentSet.size > 0 && (usersMessageSentSet.has(username) || usersMessageSentSet.has(username + "_NOTSENT") || usersMessageSentSet.has(username.split("-FOLLOWER")[0]) || usersMessageSentSet.has(username + "-FOLLOWER") || usersMessageSentSet.has(username.split("-FOLLOWER")[0] + "_NOTSENT") || usersMessageSentSet.has(username + "-FOLLOWER_NOTSENT"))) { // and check if for username + "_NOTSENT"
          if (DEBUG) console.error(`[HOWER] - Ya vimos al usuario -> ${username} CONTINUANDO - [WINDOW:${windowMessagesId}]`);
          // already seen user
          // this is in case the Follow option is activated, and deactivated, such that we can avoid repetition
          // also consider that, the set lives forever in the program
          continue;
        }
      } catch (e) {
        console.error("[HOWER:ERROR] - No se pudo validar si existe en el set!");
        sendMessagesToPreviousConversations = true;
        // de esta manera si no se puede validar, para evitar problemas, nos aseguramos que
        // el usuario no le mande mesnaje a personas que checa el content.js
        // sobre conversaciones previas!
      }

      if (linesToUse.length > 6) {
        personalization = "";
      }

      if (isSending) {
        // check if is private

        if (DEBUG) console.error(`[HOWER] Checando si el lead es privado... [WINDOW:${windowMessagesId}]`);
        // let isPrivateConfirmed = await isPrivateAccountFunc(username);
        // if (isPrivateConfirmed) {
        //   if (DEBUG) console.error(`[HOWER] El LEAD es privado!! continuando con el siguiente... [WINDOW:${windowMessagesId}]`);
        //   await delay(1000);
        //   continue;
        // }

        if (DEBUG) console.error(`[HOWER] El lead NO es privado, continuamos... [WINDOW:${windowMessagesId}]`);

        // const url = `https://www.instagram.com/${username}`;
        let inputKeywords = document.getElementById("filterWordPopupSending");
        let inputKeywordsExclude = document.getElementById("filterWordPopupSendingExclude");

        let keywords = inputKeywords.value;
        let keywordsExclude = inputKeywordsExclude.value;

        keywordArray = keywords.split(",").filter(word => word.trim() !== "");
        keywordArrayExclude = keywordsExclude.split(",").filter(word => word.trim() !== "");

        //   // whitespace from each keyword (optional, but often useful)
        if (DEBUG) console.error(`[HOWER] - Obteniendo tags de filtros - [WINDOW:${windowMessagesId}]`);
        keywordArray = keywordArray.map((keyword) => keyword.trim());
        if (DEBUG) console.error(`[HOWER] - Obtenidos tags de filtros - [WINDOW:${windowMessagesId}]`);

        if (DEBUG) console.error(`[HOWER] - Obteniendo tags de filtros a EXCLUIR - [WINDOW:${windowMessagesId}]`);
        keywordArrayExclude = keywordArrayExclude.map((keyword) => keyword.trim());
        if (DEBUG) console.error(`[HOWER] - Obtenidos tags de filtros a EXCLUIR - [WINDOW:${windowMessagesId}]`);

        //   // let resTags = await checkAllMetaTagsForKeywords(url, keywordArray);
        // let resTags = await accountIsBadProspect(username, keywordArray, keywordArrayExclude);
        // if (resTags) {
        //   if (DEBUG) console.error(`[HOWER] Lead NO es parte de los filtros o es privada, continuando... - [WINDOW:${windowMessagesId}]`);
        //   // await some random time! 
        //   if (DEBUG) console.error(`[HOWER] Esperando 1 a 3 segundos...`);
        //   await delayRandom(1000, 3000, true);
        //   continue;
        // } else {
        //   // await some random time!
        //   if (DEBUG) console.error(`[HOWER] Esperando 1 a 3 segundos...`);
        //   await delayRandom(1000, 3000, true);
        // }

        if (DEBUG) console.error(`[HOWER] LEAD ES PARTE DE LOS FILTROS! - [WINDOW:${windowMessagesId}]`);
      }



    } catch (e) {
      console.error("ERROR FUERA DE CONTEXTO " + e.toString());
    }

    if (DEBUG) console.error(`[HOWER] - Actualizando ventana con USERNAME!-> ${username} - [WINDOW:${windowMessagesId}]`);

    await chrome.tabs.update(instaTab.id, {
      url: `https://www.instagram.com/${username.split("-FOLLOWER")[0]}/`,
      //url: `https://www.instagram.com/`,
    });

    if (DEBUG) console.error(`[HOWER] - Esperando que cargue ventana!-> ${username} - [WINDOW:${windowMessagesId}]`);

    await new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
        if (info.status === "complete" && tabId === instaTab.id) {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });
    if (DEBUG) console.error(`[HOWER] - Ventana Cargada!-> ${username} - [WINDOW:${windowMessagesId}]`);


    // COMMENT
    let messages = document.getElementById("message").value.split('&&');


    // const messages = [
    //     "Hola [NOMBRE], espero que estés bien. Noté que sigues a @angieylu y pensé que podrías estar interesado en sus consejos para conseguir prospectos. He creado una lista de 50 prospectos con mi software. ¿Te gustaría que te la pase? ¡Me encanta tu contenido!",

    //     "¡Hola [NOMBRE]! Vi que sigues a @angieylu y quería preguntarte cómo te van con sus tips. Me tomé un tiempo para crear una lista de 50 prospectos utilizando mi software. ¿Te gustaría que te la compartiera? ¡Tu perfil es genial!",

    //     "Hola [NOMBRE], ¿cómo estás? Me di cuenta de que sigues a @angieylu y pensé que podrías beneficiarte de sus consejos. He compilado una lista de 50 prospectos usando mi software. ¿Te gustaría que te la envíe? ¡Me gusta tu contenido!",

    //     "¡Hola [NOMBRE]! Espero que estés teniendo un buen día. Vi que sigues a @angieylu y pensé que podrías estar buscando más prospectos. Hice una lista de 50 contactos con mi software. ¿Te gustaría que te la pase? ¡Disfruto de tu contenido!",

    //     "Hola [NOMBRE], ¿qué tal? Noté que sigues a @angieylu y creo que sus consejos son útiles. He preparado una lista de 50 prospectos con mi software. ¿Te interesa que te la envíe? ¡Me gusta lo que compartes!"
    // ];

    // Ejemplo de uso para reemplazar [NOMBRE]
    let user_name;
    try {
      user_name = user.split(",")[fullNameIndex].replace(/"/g, "").split(" ")[0];
    } catch (e) {
      user_name = "";
    }

    // let personalizedMessages = messages.map(message => message.replaceAll("[NOMBRE]", user_name));
    let personalizedMessages = messages;
    const randomIndex = Math.floor(Math.random() * personalizedMessages.length);

    const randomMessagee = personalizedMessages[randomIndex];

    if (DEBUG) console.error(`[HOWER] - Mensaje obtenidos -> ${randomMessagee}! - [WINDOW:${windowMessagesId}]`);

    // END COMMENT

    // DISCOMMENT 

    // let messageContent = document.getElementById("message").value;
    // let user_name = user.split(",")[fullNameIndex].replace(/"/g, "").split(" ")[0];
    // let newMessage = messageContent.replaceAll("[NOMBRE]", user_name);
    // newMessage = newMessage.replaceAll(
    //   "[PERSONALIZATION_IDENTIFIER]",
    //   personalization
    // );

    ////  split messages
    // let messagesArray = newMessage.split("&&");

    // Seleccionar un mensaje aleatorio
    // let randomMessagee = messagesArray[Math.floor(Math.random() * messagesArray.length)];

    ////  Eliminar los espacios del string seleccionado
    cleanedMessage = randomMessagee.trim();
    if (DEBUG) console.error(`[HOWER] - Mensajes separados y obtenidos! - [WINDOW:${windowMessagesId}]`);

    // END DISCOMMENT

    // we await random times between these ranges

    if (messageTimeDelay < 2) {
      randomTime = randomDelay(messageTimeDelay, messageTimeDelay + (Math.floor(Math.random() * 2) + 1));
    } else {
      randomTime = randomDelay(messageTimeDelay - (Math.floor(Math.random() * 2) + 1), messageTimeDelay + (Math.floor(Math.random() * 2) + 1));
    }

    if (DEBUG) console.error(`[HOWER] - Tiempo calculado -> ${randomTime}!! - [WINDOW:${windowMessagesId}]`);


    if (isSending) {
      if (DEBUG) console.error(`[HOWER] - isSending = True, Tiempo NUEVO calculado -> ${randomTime - (1000 * 60 * 1)}!! - [WINDOW:${windowMessagesId}]`);

      randomTime = randomTime - (1000 * 60 * 1) // remove 1 minute
    }
    // randomTime = 0;

    let responseMessage = `Esperando ${Math.floor(
      randomTime / 1000 / 60
    )} minutos`;
    console.log(responseMessage);

  

    try {
      if (DEBUG) console.error(`[HOWER] - Enviando MENSAJES!! ${getCurrentDateTime()} - [WINDOW:${windowMessagesId}]`);

      const response = chrome.tabs.sendMessage(instaTab.id, {
        action: "sendMessage",
        sendMessagesToPreviousConversations : isProspectingOwnerData ? true : sendMessagesToPreviousConversations,
        notSendMessageStories: notSendMessageStories,
        instaTabId: instaTab.id,
        windowId: windowMessagesId,
        messageToSend: cleanedMessage,
        filters: keywordArray,
        filtersExclude: keywordArrayExclude,
        full_name: user_name,
        providedGender: selectedGender,
        shouldFollowFollowers,
        isComments: isSending && currentInspector === "Comments",
        selectedProspectFilterLevel: selectedProspectFilterLevel,
        shouldSendMessageToNewFollowers: false,
        messagesToSendNewFollowers: followersMessageSent,
        messagesStories: JSON.parse(localStorage.getItem('storiesMessages')) || listMessagesStories,
        username,
        messagesLimit: messageLimit,
        followerMessages: followerMessages
      });

      if (DEBUG) console.error(`[HOWER] - Saliendo de Enviando MENSAJES!! ${getCurrentDateTime()} -  Respuesta -> ${response} - [WINDOW:${windowMessagesId}]`);


      // You can now use the response object
      // if (response.status === "Done") {
      //   if (response.message === "true") {
      //     // add it into the main list
      //     followersMessageSent.push(username);
      //   }
      // }
    } catch (error) {
      randomTime = randomDelay(messageTimeDelay, messageTimeDelay);
      responseMessage = `Error al enviar, Esperando ${Math.floor(
        randomTime / 1000 / 60
      )} minutos`;
      if (DEBUG) console.error(`[HOWER:ERROR] - Error Enviando MENSAJES!! Respuesta -> ${error.toString()} - [WINDOW:${windowMessagesId}]`);

    }

    // update UI

    // remove element
    // linesToUse.splice(0, 1);
    // indexMessagesSent += 1;
    // alert(indexMessagesSent);

    enablePauseMessagesButton();

    // await waitForDelay();

    let counter = 0;

    if (DEBUG) console.error(`[HOWER] - Comenzando Espera ${getCurrentDateTime()} - Enviando mensaje -> 2:30 min - [WINDOW:${windowMessagesId}]`);

    //  while (counter < 150) {
    //    if (stopMessages === true) {
    //     return;
    //    }

    //    if (messageSent || isPrivateAccount) {
    //     break;
    //    }

    //    counter += 1;
    //    await delay(1000);
    //  }

    // await delay(150000);
    try {
      abortController = new AbortController();
      await delayStanding(270000, abortController.signal);
    } catch (e) {
      if (DEBUG) console.error("[HOWER] Saliendo del timing! o no se pudo enviar el mensaje o es privada!");
    }
    // if (messageSent || isPrivateAccount) {
    //   break;
    // }



    if (stopMessages === true) {
      return;
    }
    // await delay(150000);
    if (DEBUG) console.error(`[HOWER] - Espera terminada ${getCurrentDateTime()} - Mensaje finalizado -> 2:30 min - [WINDOW:${windowMessagesId}]`);


    isPrivateAccount = false;
    messageSent = false;


    // const response = await chrome.tabs.sendMessage(instaTab.id, {
    //   action: "couldSendMessage",
    //   instaTabId: instaTab.id,
    //   windowId: windowId,
    // });
    // if (DEBUG) console.error("Received response:", response);

    //await delay(1000 * 60 * 1); // wait to check response
    // console.log("DESPUES DE VALIDAR EL MENSAJE MESSAGE REQUESTS");
    // if (wasNotInMessageRequests) {
    //   // remove from table
    //   let tableBodyValidation2 = document.getElementById("sentMessagesTableBody");
    //   // Get all the rows in the table body
    //   let rows2 = tableBodyValidation2.getElementsByTagName("tr");

    //   // Check if there are any rows in the table
    //   if (rows2.length > 0) {
    //       // Remove the last row (rows[rows.length - 1] is the last row)
    //       tableBodyValidation2.removeChild(rows2[rows2.length - 1]);
    //   }
    // } else {
    //   const now = new Date();

    //   // Obtener los componentes de la fecha y hora
    //   const day = String(now.getDate()).padStart(2, '0');
    //   const month = String(now.getMonth() + 1).padStart(2, '0');
    //   const year = String(now.getFullYear()).slice(-2);
    //   const hours = String(now.getHours()).padStart(2, '0');
    //   const minutes = String(now.getMinutes()).padStart(2, '0');
    //   const seconds = String(now.getSeconds()).padStart(2, '0');

    //   const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    //   // alert("USERNMAE " + username  + " FILENAME " + filenameMessagesSent + " howerUSERNME " + howerUsername + " CLEANED " + cleanedMessage + " TIME " + formattedDateTime);
    //   let dataResponse = await HowerAPI.registerMessageSentUser(username, filenameMessagesSent, howerUsername, cleanedMessage, formattedDateTime);
    // }

    // Why close window?
    // Imagine the window gets bugged for X o Y reason of the user
    // since the code is running independently, by closing the window
    // we make sure the Instagram session is never bugged for the rest of the users
    // and no Instagram DM is dependent on a "single session window"
    // each DM has its own window and sends its own message

    if (stopMessages === true) {
      return;
    }

    if (DEBUG) console.error(`[HOWER] - Esperando siguiente TANDA! ${getCurrentDateTime()} - [WINDOW:${windowMessagesId}]`);

    let usersMessageSentArray = Array.from(usersMessageSentSet);
    if (usersMessageSentArray.length > 0) {
      let lastItem = usersMessageSentArray[usersMessageSentArray.length - 1];
      if (lastItem === username && !lastItem.endsWith("_NOTSENT")) { // and check if for username + "_NOTSENT"
        // if the last person in the messages list is the person in here, lets await
        // else continue
        randomTime = randomTime - 150000;
        let delayInternal = randomTime;

        // if (randomTime <= 150000) {
        //   delayInternal = Math.floor(Math.random() * (300000 - 150000 + 1)) + 150000;
        //   //await delay(Math.floor(Math.random() * (300000 - 150000 + 1)) + 150000);
        // } else {
        //   delayInternal = randomTime;
        //   //await delay(randomTime);
        // }

        if (DEBUG) console.error(`[HOWER] - Esperando TANDA - Tiempo: ${delayInternal}! - ${getCurrentDateTime()} - [WINDOW:${windowMessagesId}]`);


        // counterInternal = 0;
        // while (counterInternal < (delayInternal / 1000)) {

        //   if (stopMessages === true) {
        //     return;
        //   }

        //   counterInternal += 1;
        //   await delay(1000);
        // }

        // await delay(delayInternal);
        await delay(delayInternal);
        // if (messageSent || isPrivateAccount) {
        //   break;
        // }

        if (stopMessages === true) {
          return;
        }
      }
    }

    if (DEBUG) console.error(`[HOWER] - Espera terminada siguiente TANDA! ${getCurrentDateTime()} - [WINDOW:${windowMessagesId}]`);


    disablePauseMessagesButton();



    if (DEBUG) console.error(`[HOWER] - Checando ventana final:! - ${getCurrentDateTime()} - [WINDOW:${windowMessagesId}]`);
    await delay(1000); // this is for checking if the window was closed correctly
    if (DEBUG) console.error(`[HOWER] - Checada ventana final FINAL:! - ${getCurrentDateTime()} - [WINDOW:${windowMessagesId}]`);


    //if (linesToUse.length === 0) {
    if (DEBUG) console.error(`[HOWER] - Finalizado Tanda actual - Username ${username} - Index ${indexMessagesSent} - Lineas ${linesToUse.length} -- [WINDOW:${windowMessagesId}]`);
    //if (linesToUse.length === 0) {
    if (indexMessagesSent >= linesToUse.length) {
      if (!isInspectingAndSending && !isSending) {
        if (DEBUG) console.error(`[HOWER] - Rompiendo mensajes! OJO -- [WINDOW:${windowMessagesId}]`);
        break;
      } else {
        if (DEBUG) console.error(`[HOWER] - Esperando 1 min a siguiente tanda - ${getCurrentDateTime()}  -- [WINDOW:${windowMessagesId}]`);
        await delay(1000 * 60 * 1); // 1 minute of awaiting
        if (DEBUG) console.error(`[HOWER] - Empezando siguiente tanda - ${getCurrentDateTime()}  -- [WINDOW:${windowMessagesId}]`);
      }
    }
  }

  if (DEBUG) console.error(`[HOWER] - Mensajes enviados FINALIZADOS COMPLETAMENTE - ${getCurrentDateTime()} `)
  // disableSendMessagesButton();
  disablePauseMessagesButton();
  enableSendMessagesButton();
  enableMessageEntry();
  enableRestarMessages();

  // RESET VARS
  deactivateIsSendingFromUI();

  const tableBodyFinal = document.getElementById("sentMessagesTableBody");
  const rowsFinal = tableBodyFinal.getElementsByTagName("tr");
  if (rowsFinal.length === 0) {
    // something went wrong sending messages
    document.getElementById("statusSpanSenders").style.background = "#B53737";
    document.getElementById(
      "statusSpanSenders"
    ).textContent = `Status: ¡No se encontraron prospectos! Cambia de cuenta o post para prospectar!`;
  } else {
    document.getElementById("statusSpanSenders").style.background =
      colorEndingStatus;
    document.getElementById(
      "statusSpanSenders"
    ).textContent = `Status: ${messageEndingStatus}`;
  }


  if (!shouldFollowFollowers) {
    // in case users are sending messages without following, popup must appear
    showPopupFollowingDone();
  }

  // finally, create the .csv from the background.js file
  try {
    await createCSVMessagesSent();
  } catch (e) {
    debugConsoleLog("Hubo un error al generar un .csv al terminar la tanda verde! + " + e.toString());
  }

  indexMessagesSent = 0;
  followersLstIsSendingLimit = 10000;
  newHeaders = undefined;
  openedTabId = undefined;
  isSending = false;
  messageSent = false;
  followersLst = [];
  fullEmailFollowerData = [];
  requiresFileToContinue = false;

  chrome.windows.remove(windowMessagesId, function () {
    // Create a session object and make a sample request
  });

  chrome.runtime.sendMessage(
    { action: "createMessagesDoneFile" },
    function (response) {
      console.log("Done creating the file!");
    }
  );
}

document.getElementById('clientTypeSelect').addEventListener('change', function() {
  // remove the entry of keywordsInputHowerAI
  const keywordsInput = document.getElementById('keywordsInputHowerAI');
  if (keywordsInput) {
    document.getElementById("hower-ai-description").removeChild(keywordsInput);
    
    // add option of other into select
    const otherOption = document.createElement('option');
    otherOption.value = 'otro';
    otherOption.text = 'Otro (especificar)';
    document.getElementById('clientTypeSelect').appendChild(otherOption);
    
  }
  
  document.getElementById("hower-ai-description").innerHTML = 'Opción seleccionada: <br>' + this.value;

  const customInput = document.getElementById('customClientType');
  if (this.value === 'otro') {
      customInput.style.display = 'block';
  } else {
      customInput.style.display = 'none';
      customInput.value = ''; // Clear the custom input when not selected
  }
});


document
  .getElementById("configurationSidebar")
  .addEventListener("click", async () => {
    document.getElementById("mainContent").style.display = "none";
    document.getElementById("commentsContent").style.display = "none";
    document.getElementById("aiContent").style.display = "none";
    document.getElementById("sendersContent").style.display = "none";
    document.getElementById("welcomeSection").style.display = "none";
    document.getElementById("welcomeSectionPresentation").style.display = "none";
    document.getElementById("searchPostsContent").style.display = "none";
    document.getElementById("searchPostsContent2").style.display = "none";

    document.getElementById("settingsContent").style.display = "block";
  });


document.getElementById("searchByComments").addEventListener("change", function () {
  if (this.checked) {
    searchByComments = true;
  } else {
    searchByComments = false;
  }
});

document.getElementById("aiContent").addEventListener("click", () => {
  window.open("https://app.livechatai.com/ai-bot/clos7t64x0001le0fi243s1os");
});

function showPopupOverlayPostsSearcher() {
  if (!localStorage.getItem("dontShowAgainPostsSearcher") || localStorage.getItem("dontShowAgainPostsSearcher") !== "true") {
    document.getElementById("popupOverlayPostsSearcher").style.display = "block";
    document.getElementById("welcomePopupPostsSearcher").style.display = "block";
  }
}

document.getElementById("inspectionPopupPostsSearcher").addEventListener("click", () => {
  document.getElementById("popupOverlayPostsSearcher").style.display = "none";
  document.getElementById("welcomePopupPostsSearcher").style.display = "none";
});

document.getElementById("dontShowAgainPostsSearcher").addEventListener("change", function () {
  if (this.checked) {
    localStorage.setItem("dontShowAgainPostsSearcher", "true");
  } else {
    localStorage.setItem("dontShowAgainPostsSearcher", "false");
  }
});



document.getElementById("configureAIButton").addEventListener("click", () => {
  closePopupUserHowerAiRecos();
  document.getElementById("searchPostsSidebar2").click()
});

document
  .getElementById("searchPostsSidebar")
  .addEventListener("click", async () => {
    document.getElementById("mainContent").style.display = "none";
    document.getElementById("commentsContent").style.display = "none";
    document.getElementById("aiContent").style.display = "none";
    document.getElementById("settingsContent").style.display = "none";
    document.getElementById("welcomeSection").style.display = "none";
    document.getElementById("welcomeSectionPresentation").style.display = "none";
    document.getElementById("searchPostsContent2").style.display = "none";
    document.getElementById("searchPostsContent").style.display = "block";
    // showPopupOverlayPostsSearcher();
  });


  document.getElementById("saveKeywordsButton").addEventListener("click", async () => {
    await handleSubmit();
  });

  function showPersonalizedKeywordsWarning() {
    // Crear el popup si no existe
    let popup = document.createElement('div');
    popup.id = 'personalizedKeywordsWarning';
    popup.className = 'popup';
    popup.style.cssText = `
        display: flex;
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: #fff3cd;
        border: 1px solid #ffeeba;
        color: #856404;
        padding: 20px;
        border-radius: 8px;
        z-index: 9999;
        flex-direction: column;
        align-items: center;
        min-width: 300px;
        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;

    // Contenido del popup
    popup.innerHTML = `
        <h3 style="margin: 0 0 15px 0; color: #856404;">¡Atención!</h3>
        <p style="margin: 0 0 20px 0; text-align: center;">
            Si seleccionas palabras personalizadas, las recomendaciones serán tu responsabilidad, elige tus palabras con cuidado para recibir recomendaciones acorde a tu nicho!
        </p>
        <button id="understandButton" style="
            background-color: #856404;
            color: white;
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: not-allowed;
            opacity: 0.5;
        " disabled>
            Entiendo (5s)
        </button>
    `;

    // Agregar overlay
    let overlay = document.createElement('div');
    overlay.id = 'personalizedKeywordsWarningOverlay';
    overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9998;
    `;

    // Agregar al DOM
    document.body.appendChild(overlay);
    document.body.appendChild(popup);

    // Contador para el botón
    let secondsLeft = 5;
    const button = popup.querySelector('#understandButton');
    
    const countdown = setInterval(() => {
        secondsLeft--;
        button.textContent = `Entiendo (${secondsLeft}s)`;
        
        if (secondsLeft === 0) {
            clearInterval(countdown);
            button.textContent = 'Entiendo';
            button.style.cursor = 'pointer';
            button.style.opacity = '1';
            button.removeAttribute('disabled');
        }
    }, 1000);

    // Event listener para el botón
    button.addEventListener('click', async () => {
        if (secondsLeft === 0) {
            document.body.removeChild(popup);
            document.body.removeChild(overlay);
            // Aquí continúa el flujo normal del código
            await handleSubmit(true);
        }
    });

    return new Promise((resolve) => {
        button.addEventListener('click', () => {
            if (secondsLeft === 0) {
                resolve();
            }
        });
    });
}

  async function handleSubmit(hasClickedConfirmation = false) {
    try {
        const location = document.getElementById('locationInput').value;
        const whatsAppNumber = document.getElementById('whatsAppNumberInput').value;
        
        const formData = new FormData();
        formData.append('howerUsername', howerUsername);
        formData.append('howerPassword', howerToken);
        formData.append('location', location);
        formData.append('whatsAppNumber', whatsAppNumber);
        const category = document.getElementById('clientTypeSelect').value;
        
          let isPersonalizedKeywords = !!document.getElementById('keywordsInputHowerAI');

          if (isPersonalizedKeywords) {
              const keywords = document.getElementById('keywordsInputHowerAI').value;
              formData.append('category', keywords);
          } else {
            if (category === 'otro') {
                const customCategory = document.getElementById('customClientType').value;
                formData.append('category', customCategory);
                isPersonalizedKeywords = true;
            } else if (category === 'none') {
              alert("Elige un tipo de cliente que buscas para recomendaciones!");
              return;
            } else {
                formData.append('category', category);
            }
          }


          if (isPersonalizedKeywords && !hasClickedConfirmation) {
              // alerta por 5 segundos advirtiendo que si son palabras personalizadas
              // las recomenndaciones seran de esas palabras y por lo tanto 
              // puede o no puede recibir publicaciones afines a su nicho
              // es su respoabilidad!
              await showPersonalizedKeywordsWarning();
              return;
          }

        // hide the popup
        try{
          document.getElementById("personalizedKeywordsWarning").style.display = "none";
          document.getElementById("personalizedKeywordsWarningOverlay").style.display = "none";
        } catch(error){
          console.error("Error al ocultar el popup de palabras personalizadas:", error);
        }

        const response = await fetch('http://hower-website-production.up.railway.app/clients/blog/sec_6_api/', {
            method: 'POST',
            body: formData,
            credentials: 'include',
            headers: {
                'Accept': 'application/json',
            }
        }).catch(error => {
            // Manejar errores de red
            console.error("Network error:", error);
            throw new Error('Error de red al intentar conectar con el servidor');
        });

        // Verificar si la respuesta existe antes de usar .ok
        if (!response) {
            throw new Error('No se recibió respuesta del servidor');
        }

        if (response.ok) {
            alert('¡Guardado con éxito!');
            document.getElementById('locationInput').value = '';
            document.getElementById('clientTypeSelect').value = '';
            document.getElementById('customClientType').value = '';
            document.getElementById('customClientType').style.display = 'none';

            document.getElementById("aiReturnButton").click();

            //
        } else {
            // Intentar obtener el mensaje de error del servidor
            const errorData = await response.text();
            throw new Error(`Error del servidor: ${errorData}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Hubo un error al guardar. Por favor, intenta de nuevo.\nDetalle: ' + error.message);
    }
}


async function getInstaHowerAIConf() {
  // get keywords from the class HowerAPI
  const conf = await HowerAPI.getInstaHowerAIConf(howerUsername, howerToken);
  let keywords = conf.keywords;

  if (keywords) {
    // show the data in the UI

    document.getElementById("whatsAppNumberInput").value = conf.phone_number;
    
    // aqui busca el pais en el select y lo selecciona, de lo contrario si no encuentra, lo deja por default
    const locationInput = document.getElementById("locationInput");
    const locationOption = Array.from(locationInput.options).find(option => option.value === conf.location);
    if (locationOption) {
      locationInput.value = locationOption.value;
    } else {
      locationInput.value = "De cualquier lugar";
    }

    // detele the other option from the type of client, its the last item!
    const otherOption = document.getElementById("clientTypeSelect").options[document.getElementById("clientTypeSelect").options.length - 1];
    document.getElementById("clientTypeSelect").removeChild(otherOption);

    // show those keywords in the doc
    document.getElementById("hower-ai-description").innerHTML = 'Tus palabras clave (separadas por comas): <br>';

    // agregar input type text para las keywords, pero en forma de textarea estilizado
    const keywordsInput = document.createElement("textarea");
    keywordsInput.id = "keywordsInputHowerAI";
    keywordsInput.type = "text";
    keywordsInput.style.width = "90%";
    keywordsInput.style.height = "100px";
    keywordsInput.style.backgroundColor = "#34344a";
    keywordsInput.style.color = "#ffffff";
    keywordsInput.style.padding = "0.8rem";
    keywordsInput.style.border = "1px solid #2a2a3c";
    keywordsInput.style.borderRadius = "6px";
    keywordsInput.style.fontSize = "0.9rem";
    keywordsInput.style.resize = "vertical";  
    keywordsInput.value = keywords;

    document.getElementById("hower-ai-description").style.color = "white";
    document.getElementById("hower-ai-description").appendChild(keywordsInput);
  }
}

document
  .getElementById("searchPostsSidebar2")
  .addEventListener("click", async () => {
    document.getElementById("mainContent").style.display = "none";
    document.getElementById("commentsContent").style.display = "none";
    document.getElementById("aiContent").style.display = "none";
    document.getElementById("settingsContent").style.display = "none";
    document.getElementById("welcomeSection").style.display = "none";
    document.getElementById("welcomeSectionPresentation").style.display = "none";
    document.getElementById("searchPostsContent").style.display = "none";

    document.getElementById("searchPostsContent2").style.display = "block";
    
    // get keywords
    getInstaHowerAIConf();

    // showPopupOverlayPostsSearcher();
  });

document
  .getElementById("sendersSidebar")
  .addEventListener("click", async () => {
    document.getElementById("mainContent").style.display = "none";
    document.getElementById("commentsContent").style.display = "none";
    document.getElementById("aiContent").style.display = "none";
    document.getElementById("settingsContent").style.display = "none";
    document.getElementById("welcomeSectionPresentation").style.display = "none";
    document.getElementById("welcomeSection").style.display = "none";
    document.getElementById("welcomeSectionPresentation").style.display = "none";
    document.getElementById("searchPostsContent").style.display = "none";
    document.getElementById("searchPostsContent2").style.display = "none";

    document.getElementById("sendersContent").style.display = "block";
    // showPopupNewUpdate();
  });

document
  .getElementById("followersInspectorSidebar")
  .addEventListener("click", () => {
    document.getElementById("sendersContent").style.display = "none";
    document.getElementById("commentsContent").style.display = "none";
    document.getElementById("aiContent").style.display = "none";
    document.getElementById("settingsContent").style.display = "none";
    document.getElementById("welcomeSection").style.display = "none";
    document.getElementById("welcomeSectionPresentation").style.display = "none";
    document.getElementById("searchPostsContent").style.display = "none";
    document.getElementById("welcomeSectionPresentation").style.display = "none";
    document.getElementById("searchPostsContent2").style.display = "none";
    showPopupInspectorInstructions();
    document.getElementById("mainContent").style.display = "block";
  });



document.getElementById("aiContent").addEventListener("click", () => {
  window.open("https://app.livechatai.com/ai-bot/clos7t64x0001le0fi243s1os");
});


// document.getElementById('ai-question').addEventListener('click', () => {
//   document.getElementById("sendersContent").style.display = "none";
//   document.getElementById("commentsContent").style.display = "none";
//   document.getElementById("mainContent").style.display = "none";
//   document.getElementById("settingsContent").style.display = "none";
//   document.getElementById("welcomeSection").style.display = "none";
//   document.getElementById("searchPostsContent").style.display = "none";

//   document.getElementById("aiContent").style.display = "block";
// });



function validateDsUserId(cookieString, expectedUserId) {
  // Extract ds_user_id value using regex
  const match = cookieString.match(/ds_user_id=(\d+)/);
  if (!match) return false;
  
  const actualUserId = match[1];
  return actualUserId === expectedUserId;
}


document.getElementById('sendBtnAI').addEventListener('click', async () => {
  const input = document.getElementById('userInputAI').value;
  const responseBox = document.getElementById('responseBoxAI');
  responseBox.textContent = "Thinking...";

  const apiKey = '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'; // <-- NO usar en producción así

  const messages = [
    {
      role: "system",
      content: "You are a friendly GPT assistant that helps with productivity tips and answers simple questions in a short, clear way."
    },
    {
      role: "user",
      content: input
    }
  ];

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4.1-nano-2025-04-14",
        messages: messages
      })
    });

    const data = await res.json();
    const reply = data.choices[0].message.content;

    // 🪄 Animación letra por letra
    responseBox.textContent = ""; // Vaciar antes de escribir
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < reply.length) {
        responseBox.textContent += reply.charAt(i);
        i++;
      } else {
        clearInterval(typeInterval); // Parar cuando termine
      }
    }, 20); // Velocidad: menor = más rápido (ajusta si quieres)

  } catch (error) {
    responseBox.textContent = "Error: " + error.message;
  }
});


document.getElementById('ai-question').addEventListener('click', () => {
  window.open(" https://wa.me/5213331062355?text=Hola!%20necesito%20ayuda%0A%0Ami%20usuario:%20" + howerUsername + "%0A%0A", "_blank");
});


async function fetchInstagramData(query) {

  if (!await instagramIsLoggedIn()) {
    if (DEBUG) console.error("[HOWER] -CSRF TOKEN UNDEFINED, CHECKING LOGIN");
    executeInstagramLoginCheck();
    await delay(1000 * 5); // await 5 seconds and see if everything is ok
  }

  fetch("https://www.instagram.com/graphql/query", {
    "headers": {
      "accept": "*/*",
      "accept-language": "en-US,en;q=0.9,es;q=0.8",
      "content-type": "application/x-www-form-urlencoded",
      "dpr": "2",
      "x-csrftoken": csrf_token,
      "x-fb-friendly-name": "PolarisSearchBoxRefetchableQuery",
      "x-ig-app-id": "936619743392459"
    },
    "body": "av=17841441139100950&__d=www&__user=0&__a=1&__req=17&__hs=20100.HYP%3Ainstagram_web_pkg.2.1.0.0.1&dpr=2&__ccg=GOOD&__rev=1019280374&__s=cj1s2s%3Ab6mc7p%3Aygxvcw&__hsi=7458871980235206319&__dyn=7xeUjG1mxu1syUbFp41twpUnwgU7SbzEdF8aUco2qwJxS0k24o1DU2_CwjE1EE2Cw8G11wBz81s8hwGxu786a3a1YwBgao6C0Mo2swaOfK0EUjwGzEaE2iwNwmE2eUlwhEe87q0nKq2-azqwt8d-2u2J0bS1LwTwKG1pg2fwxyo6O1FwlEcUed6goK10K5V8aUuwm9EO6UaUaE2xG8BK4o&variables=" + encodeURIComponent(JSON.stringify({
      "data": {
        "context": "blended",
        "include_reel": "true",
        "query": query,
        "rank_token": "1736653978681|61ed0e7e952d562ad9ea9824760389cb0e50203bdd55e9404b7919f67bcfb200",
        "search_surface": "web_top_search"
      },
      "hasQuery": true
    })) + "&server_timestamps=true&doc_id=9153895011291216",
    "method": "POST",
    "mode": "cors",
    "credentials": "include"
  })
    .then(response => response.json())
    .then(data => {
      const resultsContainer = document.getElementById('searchResults');
      if (DEBUG) console.error("DATA SEARCH RESULTS ", JSON.stringify(data.data.xdt_api__v1__fbsearch__topsearch_connection));
      const users = data.data.xdt_api__v1__fbsearch__topsearch_connection.users;

      // Limpiar resultados anteriores
      resultsContainer.innerHTML = '';

      // Si no hay resultados
      if (!users || users.length === 0) {
        resultsContainer.innerHTML = `
        <div style="padding: 20px; text-align: center; color: #8e8e8e;">
          No se encontraron resultados, asegurate de que tengas una sesión iniciada en Instagram <a href="https://www.instagram.com" target="_blank">www.instagram.com</a> 
        </div>
      `;
        return;
      }

      if (DEBUG) console.error("USERS", JSON.stringify(users));

      // Crear elementos para cada usuario encontrado
      // ... existing code ...

      users.forEach(item => {
        const user = item.user;
        const verifiedBadge = user.is_verified ? `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="14" height="14" fill="#1DA1F2">
        <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
      </svg>
    ` : '';

        // Crear el contenedor principal
        const userDiv = document.createElement('div');
        userDiv.style.cssText = `
      display: flex;
      align-items: center;
      padding: 12px 16px;
      gap: 12px;
      border-bottom: 1px solid #f0f0f0;
      cursor: pointer;
      width: 100%;
      box-sizing: border-box;
      min-width: 0;
    `;

        // Agregar el event listener al contenedor
        userDiv.addEventListener('click', () => handleUserClick(user.username, validateDsUserId(newCookies, user.id)));

        // Establecer el HTML interno
        userDiv.innerHTML = `
      <img 
        src="${user.profile_pic_url}" 
        style="
          width: 44px;
          height: 44px;
          border-radius: 50%;
          object-fit: cover;
          flex-shrink: 0;"
          onerror="this.src='ruta/a/imagen/default.jpg';"
          crossorigin="anonymous"
      >
      <div style="
        flex: 1;
        min-width: 0;
        overflow: hidden;">
        <div style="
          display: flex;
          align-items: center;
          gap: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;">
          <span style="
            font-weight: 600;
            color: #262626;
            overflow: hidden;
            text-overflow: ellipsis;">
            ${user.username}
          </span>
          ${verifiedBadge}
        </div>
        <div style="
          display: flex;
          align-items: center;
          gap: 8px;
          color: #8e8e8e;
          font-size: 14px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;">
          ${user.full_name}
          ${validateDsUserId(newCookies, user.id) ? 
            `<span style="
              font-size: 12px;
              color: #9A7FFF;
              background: rgba(154, 127, 255, 0.1);
              padding: 2px 6px;
              border-radius: 4px;">tu cuenta</span>` : ''}
        </div>
      </div>
      <div hidden data-is-owner="${validateDsUserId(newCookies, user.id)}"></div>
    `;

        resultsContainer.appendChild(userDiv);
      });

      // Función que maneja el click en un usuario
      function handleUserClick(username, _isProspectingOwnerData) {
        document.getElementById("emailPrepared").value = username;
        isProspectingOwnerData = _isProspectingOwnerData;
        goNextSendInstagramMessage3();
        // Aquí puedes agregar la lógica que necesites ejecutar cuando se hace click en un usuario
      }

      // ... rest of the code ...
    })
    .catch(error => {
      if (DEBUG) console.error("Error:", error);
      const resultsContainer = document.getElementById('searchResults');
      resultsContainer.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #8e8e8e;">
        Error al buscar usuarios, verifica que tengas una sesión iniciada en Instagram <a href="https://www.instagram.com" target="_blank">www.instagram.com</a>
      </div>
    `;
    });
}






document
  .getElementById("commentsInspectorSidebar")
  .addEventListener("click", () => {
    document.getElementById("sendersContent").style.display = "none";
    document.getElementById("mainContent").style.display = "none";
    document.getElementById("aiContent").style.display = "none";
    document.getElementById("settingsContent").style.display = "none";
    document.getElementById("welcomeSection").style.display = "none";
    document.getElementById("welcomeSectionPresentation").style.display = "none";
    document.getElementById("searchPostsContent").style.display = "none";

    showPopupInspectorInstructions();
    document.getElementById("commentsContent").style.display = "block";
  });

// buttons for inspectors

document
  .getElementById("downloadButtonGeneral")
  .addEventListener("click", showDownloadPopup);
document
  .getElementById("downloadButtonGeneralComments")
  .addEventListener("click", showDownloadPopup);

document.getElementById("AIButton").addEventListener("click", function () {
  window.open("https://chatgpt.com/g/g-67d37e911af88191b2c6bc19ae400953-hower-ai-messages", "_blank");
});

document.getElementById("AIButton2").addEventListener("click", function () {
  window.open("https://chatgpt.com/g/g-67d37e911af88191b2c6bc19ae400953-hower-ai-messages", "_blank");
});

document.getElementById("AIButton3").addEventListener("click", function () {
  window.open("https://chatgpt.com/g/g-67d37e911af88191b2c6bc19ae400953-hower-ai-messages", "_blank");
});


document
  .getElementById("dontShowAgainAI")
  .addEventListener("change", function () {
    if (this.checked) {
      // Acción a realizar cuando se hace check
      console.log(
        'La opción "No volver a mostrar este mensaje" ha sido seleccionada.'
      );
      // Aquí puedes agregar el código que desees ejecutar cuando se seleccione la casilla
      // Por ejemplo, guardar el estado en localStorage
      localStorage.setItem("dontShowAgainAI", "true");
    } else {
      // Acción a realizar cuando se desmarca
      console.log(
        'La opción "No volver a mostrar este mensaje" ha sido desmarcada.'
      );
      // Puedes agregar el código para revertir la acción, si es necesario
      localStorage.removeItem("dontShowAgainAI");
    }
  });

document
  .getElementById("dontShowAgainAISeparateMessages")
  .addEventListener("change", function () {
    if (this.checked) {
      // Acción a realizar cuando se hace check
      console.log(
        'La opción "No volver a mostrar este mensaje" ha sido seleccionada.'
      );
      // Aquí puedes agregar el código que desees ejecutar cuando se seleccione la casilla
      // Por ejemplo, guardar el estado en localStorage
      localStorage.setItem("dontShowAgainAISeparateMessages", "true");
    } else {
      // Acción a realizar cuando se desmarca
      console.log(
        'La opción "No volver a mostrar este mensaje" ha sido desmarcada.'
      );
      // Puedes agregar el código para revertir la acción, si es necesario
      localStorage.removeItem("dontShowAgainAISeparateMessages");
    }
  });



document
  .getElementById("dontShowAgainAIUpdateDetails")
  .addEventListener("change", function () {
    if (this.checked) {
      // Acción a realizar cuando se hace check
      console.log(
        'La opción "No volver a mostrar este mensaje" ha sido seleccionada.'
      );
      // Aquí puedes agregar el código que desees ejecutar cuando se seleccione la casilla
      // Por ejemplo, guardar el estado en localStorage
      localStorage.setItem("dontShowAgainAIUpdateDetails", "true");
    } else {
      // Acción a realizar cuando se desmarca
      console.log(
        'La opción "No volver a mostrar este mensaje" ha sido desmarcada.'
      );
      // Puedes agregar el código para revertir la acción, si es necesario
      localStorage.removeItem("dontShowAgainAIUpdateDetails");
    }
  });


document
  .getElementById("dontShowAgainUpdatesAvailable")
  .addEventListener("change", function () {
    if (this.checked) {
      // Acción a realizar cuando se hace check
      localStorage.setItem("dontShowAgainUpdatesAvailable", "true");
    } else {
      // Puedes agregar el código para revertir la acción, si es necesario
      localStorage.removeItem("dontShowAgainUpdatesAvailable");
    }
  });


document
  .getElementById('dontShowAgainNotificationMessage')
  .addEventListener('click', async function () {
    if (this.checked) {
      await HowerAPI.changeLastMessageNoShow(howerUsername, howerToken);
      closeNotification();
    } else {
      // Puedes agregar el código para revertir la acción, si es necesario
      localStorage.removeItem("dontShowAgainNotificationMessage");
    }
  });

function showDownloadPopup() {
  document.getElementById("welcomePopupDownload").style.display = "block";
  document.getElementById("popupOverlayDownload").style.display = "block";
}

document
  .getElementById("closeButtonDownload")
  .addEventListener("click", function () {
    document.getElementById("welcomePopupDownload").style.display = "none";
    document.getElementById("popupOverlayDownload").style.display = "none";
  });

document
  .getElementById("closePopupFollowingDone")
  .addEventListener("click", function () {
    document.getElementById("popupOverlayFollowingDone").style.display = "none";
    document.getElementById("welcomePopupFollowingDone").style.display = "none";
  });

document
  .getElementById("closePopupUpdatesAvailable")
  .addEventListener("click", closePopupUpdatesAvailable);



function setLoadingOpenNewTabButtonPopupText(statusSpanId = "statusSpan") {
  document.getElementById(statusSpanId).textContent = "Status: CARGANDO...";
}



document.getElementById("aiFollowUpsSidebar").addEventListener("click", () => {
  if (!localStorage.getItem("dontShowAgainAIFollowUps") || localStorage.getItem("dontShowAgainAIFollowUps") !== "true") {
    document.getElementById("popupOverlayAIFollowUps").style.display = "block";
    document.getElementById("welcomePopupAIFollowUps").style.display = "block";
  } else {
    document.getElementById("homeSidebarOption").click();
    window.open("https://chatgpt.com/g/g-674be90c935c81918a9d5005f8c9bd29-hower-ai-messages", "_blank");
  }
});


document.getElementById("closePopupOverlayAIFollowUps").addEventListener("click", () => {
  document.getElementById("popupOverlayAIFollowUps").style.display = "none";
  document.getElementById("welcomePopupAIFollowUps").style.display = "none";
  document.getElementById("homeSidebarOption").click();
  window.open("https://chatgpt.com/g/g-674be90c935c81918a9d5005f8c9bd29-hower-ai-messages", "_blank");
});


document.getElementById("dontShowAgainAIFollowUps").addEventListener("change", function () {
  if (this.checked) {
    localStorage.setItem("dontShowAgainAIFollowUps", "true");
  } else {
    localStorage.setItem("dontShowAgainAIFollowUps", "false");
  }
});

document
  .getElementById("openNewTabButtonPopup")
  .addEventListener("click", () => {
    deactivateIsSendingFromUI();
    newHeaders = undefined;
    openedTabId = undefined;
    isSending = false;

    setLoadingOpenNewTabButtonPopupText();
    inspect();
  });
// document
//   .getElementById("sendInstagramMessagePopup")
//   .addEventListener("click", async () => {
//     document.getElementById("message").value =
//       document.getElementById("messagePopup").value;

//     if (isInspectingAndSending) {
//       await Promise.all([sendInstagramDMMessages(), inspect()]);
//     } else if (isSending) {
//       await Promise.all([sendInstagramDMMessages(), inspect()]);
//     }
//   });




let inputCount = 1; // We already have one input by default
const maxInputs = 5; // Maximum number of inputs allowed
//   const inputContainer = document.getElementById('inputContainer');
//   const addInputButton = document.getElementById('addInput');
//   const removeInputButton = document.getElementById('removeInput');

//   // Add new input when + button is clicked
//   addInputButton.addEventListener('click', () => {
//       if (inputCount < maxInputs) {
//          document.getElementById(`messagePopup${inputCount}`).style.display = 'block';
//          inputCount++;
//       } else {
//           alert('Puedes agregar hasta 5 mensajes.');
//       }
//   });

//   removeInputButton.addEventListener('click', () => {
//     if (inputCount > 1) {
//         document.getElementById(`messagePopup${inputCount}`).style.display = 'none';
//         inputCount--;
//     } else {
//         alert('Debe haber al menos un mensaje.');
//     }
// });


// Function to collect text from inputs
function collectInputValues() {
  const messages = [];
  for (let i = 0; i < inputCount; i++) {
    const inputValue = "";//document.getElementById(`messagePopup${i}`).value;
    if (inputValue === "") {
      continue;
    }
    messages.push(inputValue);
  }
  messages.push(document.getElementById(`messagePrepared`).value);
  return messages;
}

// Example of how to collect values when sending the message
document.getElementById('sendInstagramMessagePopup').addEventListener('click', async () => {
  await sendInstagramMessagePopupFunc();
});


async function sendInstagramMessagePopupFunc(newMessageContent = "") {
  try {

    const collectedMessages = collectInputValues();
    let messageContent = "";
    for (let _mess of collectedMessages) {
      messageContent += _mess + "&&";
    }

    messageContent = messageContent.slice(0, -2);
    if (newMessageContent.length === 0) {
      document.getElementById("messagePrepared").value = messageContent.replaceAll("&&", "\n&&\n");
    } else {
      document.getElementById("messagePrepared").value = newMessageContent.replaceAll("&&", "\n&&\n");
    }

    updateMessagePreparedUI();
    let formattedMessages = newMessageContent.split("&&").map((message, index) => {
      return `Versión ${index + 1}: <br>${message.trim().replaceAll(/\n/g, '<br>')}`; // Usamos <br> para salto de línea en HTML
    }).join('<br><br>'); // Saltos de línea entre mensajes

    // document.getElementById("messageExample2").innerHTML = formattedMessages
    updateMessageCarousel(newMessageContent.split("&&"));
    document.getElementById("message").value = document.getElementById("messagePrepared").value;

    const match = document.getElementById("emailPrepared").value.match(/\/(p|reel)\/(.*?)(\/#|\/|$)/);
    if (match && match.length > 1) {
      currentInspector = "Comments";
      document.getElementById("postURL").value = document.getElementById("emailPrepared").value;
    } else {
      currentInspector = "Followers";
    }

    document.getElementById("confSpanSenders").style.display = 'block';
    stopUpdateInterval();


    if (isInspectingAndSending) {
      await Promise.all([sendInstagramDMMessages(), inspect()]);
    } else if (isSending && currentInspector === "Followers") {
      await Promise.all([sendInstagramDMMessages(), inspect()]);
    } else if (isSending && currentInspector === "Comments") {
      end_cursor = "";
      await Promise.all([sendInstagramDMMessages(), openNewWindow()]);
    } else if (!requiresFileToContinue) {
      await sendInstagramDMMessages()
    }
  } catch (error) {
    console.error("Error al enviar mensajes:", error);
    if (error.message.includes("No tab with id")) {
      debugConsoleLog("La pestaña necesaria para enviar mensajes no está disponible. Por favor, verifica si la pestaña fue cerrada.");

      // const newWindow = await chrome.windows.create({
      //   url: chrome.runtime.getURL("popup.html"),
      //   type: 'popup',
      //   width: 800,  // Ancho deseado
      //   height: 600, // Alto deseado
      //   focused: false // La ventana no tomará el foco
      // });
      // const windowId = newWindow.id;
      // windowMessagesId = windowId; // this for enabling the stop messages destroy the window

      // console.log("New window created with ID:", windowId);

      // // Get the ID of the first tab in the new window
      // let instaTab = newWindow;
      // if (newWindow.tabs && newWindow.tabs.length > 0) {
      //   instaTab = newWindow.tabs[0];
      // }
      // Aquí puedes intentar reabrir la pestaña o manejar el error de otra manera
    }
  }
  // Aquí puedes añadir la lógica para enviar los mensajes
}


document.getElementById('changeInspectorButton').addEventListener('click', () => {
  currentInspector = document.getElementById('currentInspectorMessage').value;
  if (currentInspector === "Followers") {
    document.getElementById('email').value = document.getElementById('inspectorTargetMessage').value;
  } else if (currentInspector === "Comments") {
    document.getElementById('postURL').value = document.getElementById('inspectorTargetMessage').value;
  }

  closeNotificationWrongInspector();

  const targetId = document.getElementById('inspectorTargetId').value;
  document.getElementById(targetId).click();
});



document.getElementById("notificationCloseRetake").addEventListener("click", function () {
  closeNotificationWrongInspector();
})


document.getElementById('stayInspectorButton').addEventListener('click', () => {
  forceInspector = true;
  closeNotificationWrongInspector();
  openNewWindow();
});


// document.getElementById("email").addEventListener("change", function() {
//   const match = this.value.match(/\/(p|reel)\/(.*?)(\/#|\/|$)/);
//   if (match) {
//     document.getElementById("postURL").value = match[0];
//     document.getElementById("commentsInspectorSidebar").click();
//   }
// });

// Other inspectors
// document.getElementById('openNewTabButtonPopup').addEventListener('click', showInspectorsPopup);
// document.getElementById('openNewTabButtonPopup').addEventListener('click', showInspectorsPopup);

function deactivateIsSendingFromUI() {
  if (!isNetworkerPanel()) {
    isSending = false;
  }
  isInspectingAndSending = false;
  document.getElementById('confSpanSenders').style.display = 'none';
}

// normal inspect
document.getElementById("openNewTabButton").addEventListener("click", () => {
  deactivateIsSendingFromUI();
  inspect();
});

document
  .getElementById("openNewTabButtonAndSend")
  .addEventListener("click", () => {
    deactivateIsSendingFromUI();
    showEnterMessagePopup();
  });
document
  .getElementById("openNewTabButtonSend")
  .addEventListener("click", () => {
    isInspectingAndSending = false;
    isSending = true;
    showEnterMessagePopup();
  });

function inspect() {
  document.getElementById("freeAccountsText").textContent =
    "Cuentas disponibles: ";
  currentInspector = "Followers";
  end_cursor = "";
  openNewWindow();
}

document
  .getElementById("openNewTabButtonHashtag")
  .addEventListener("click", () => {
    document.getElementById("freeAccountsText").textContent =
      "Cuentas disponibles: ";
    currentInspector = "Hashtag";
    isSending = false;

    setLoadingOpenNewTabButtonPopupText();
    openNewWindow();
  });

document
  .getElementById("openNewTabButtonComments")
  .addEventListener("click", () => {
    document.getElementById("freeAccountsText").textContent =
      "Cuentas disponibles: ";
    currentInspector = "Comments";
    isSending = false;

    setLoadingOpenNewTabButtonPopupText("statusSpanComments");
    openNewWindow();
  });

function openNewWindow() {

  if (currentInspector === "Comments") {
    // check for the text inside of the input and see if its a url post, if not, throw popup!
    const match = document.getElementById("postURL").value.match(/\/(p|reel)\/(.*?)(\/#|\/|$)/);
    if (!match || match.length < 2 && !forceInspector) {
      document.getElementById('notificationPopupInspectorSource').textContent = "Comentarios";
      document.getElementById('notificationPopupInspectorTarget').textContent = "Seguidores";
      document.getElementById('inspectorTargetId').value = "followersInspectorSidebar";
      document.getElementById('inspectorTargetMessage').value = document.getElementById("postURL").value;
      document.getElementById('currentInspectorMessage').value = "Followers";
      document.getElementById('notificationPopupWrongInspector').style.display = 'flex';
      return;
    }
  } else if (currentInspector === "Followers") {
    // check if the input contais a reel url as checked in other cases, and if so open the popup!
    const match = document.getElementById("email").value.match(/\/(p|reel)\/(.*?)(\/#|\/|$)/);
    if (DEBUG) console.error("ENTERING")
    if (match && match.length > 1 && !forceInspector) {
      document.getElementById('notificationPopupInspectorSource').textContent = "Seguidores";
      document.getElementById('notificationPopupInspectorTarget').textContent = "Comentarios";
      document.getElementById('inspectorTargetId').value = "commentsInspectorSidebar";
      document.getElementById('inspectorTargetMessage').value = document.getElementById("email").value;
      document.getElementById('currentInspectorMessage').value = "Comments";
      document.getElementById('notificationPopupWrongInspector').style.display = 'flex';
      return;
    }
  }

  forceInspector = false;

  chrome.windows.create(
    {
      url: `https://www.instagram.com/reels/${getRandomWord()}`,
      state: "minimized"
    },
    function (newWindow) {
      openedTabId = newWindow.tabs[0].id;

      // Asegurarnos de que pasamos un booleano explícito
      setTimeout(() => {
        const shouldClose = true; // valor booleano explícito
        extractDataFromWindow(newWindow.id, shouldClose);
      }, 2000);
    }
  );
}

document
  .getElementById("pauseAndUpdateInstance")
  .addEventListener("click", async function () {
    await pauseAndUpdateInstance("downloadButtonGeneral", "statusSpan", "pauseAndUpdateInstance", "openNewTabButtonPopup");
    newHeaders = undefined;
    openedTabId = undefined;

    initialAccountsInspected = 0;
    initialEmailsInspected = 0;
    initialNumbersInspected = 0;
    isAlerted = false;
    followersLst = [];
    requiresFileToContinue = false;
    index = -4;
    end_cursor = "";




    // followersLst = []
    // index = 0
    // initialAccountsInspected = 0
    // initialEmailsInspected = 0
    // initialNumbersInspected = 0
    //   end_cursor = res.end_cursor;



  });


document
  .getElementById("pauseAndUpdateInstanceComments")
  .addEventListener("click", async function () {
    await pauseAndUpdateInstance(
      "downloadButtonGeneralComments",
      "statusSpanComments",
      "pauseAndUpdateInstanceComments",
      "openNewTabButtonComments"
    );

    newHeaders = undefined;
    openedTabId = undefined;
    initialAccountsInspected = 0;
    initialEmailsInspected = 0;
    initialNumbersInspected = 0;
    isAlerted = false;
    followersLst = [];
    requiresFileToContinue = false;
    index = -4;
    end_cursor = "";
  });

async function pauseAndUpdateInstanceNOUI() {
  try {
    let res = await HowerAPI.updateInstanceData(
      howerUsername,
      howerToken,
      usernameInspected,
      getFilteredFollowersLst(),
      index,
      countAccounts,
      countEmails,
      countPhoneNumbers,
      end_cursor
    );

    return res;
  } catch (e) {
    if (DEBUG) console.error(
      "[FATAL] COULD NOT UPDATE THE INSTANCE OF THE USER, CHECK THAT"
    );
  }
}

function changeStatusPaused(statusSpanID) {
  document.getElementById(statusSpanID).style.color = "#000000";
  document.getElementById(statusSpanID).textContent =
    "Status: Inspección pausada";
  document.getElementById(statusSpanID).style.backgroundColor = `#FFFF00`;
}

async function pauseAndUpdateInstance(downloadButtonID, statusSpan, pauseButtonID, inspectButtonID) {
  let res = false;
  enableInspectButton(inspectButtonID);

  if (isSending) {
    res = true;
    stopMessagesInsta();
  } else {
    res = await HowerAPI.updateInstanceData(
      howerUsername,
      howerToken,
      usernameInspected,
      getFilteredFollowersLst(),
      index,
      countAccounts,
      countEmails,
      countPhoneNumbers,
      end_cursor
    );
  }

  if (res === true) {
    alert("Inspección detenida correctamente!");
    isInstanceStopped = true;
    disablePauseButton(pauseButtonID);

    changeStatusPaused(statusSpan);

    if (!isSending) {
      await createCSV(fullEmailFollowerData); // create csv when paused and download
      await showDownloadCSVButton(downloadButtonID);
      disablePauseButton(pauseButtonID);
    }

    if (downloadButtonID === "downloadButtonGeneral") {
      await suggestAccountsToInspect(userId);
    }
    await showPopupPostInspection();
  } else {
    alert("ERROR EN INSPECCION");
  }
}

// document
//   .getElementById("restartInstance")
//   .addEventListener("click", restartInstance);
document
  .getElementById("restartInstanceComments")
  .addEventListener("click", async () => {
    currentInspector = "Comments";
    await restartInstance();
  });

async function restartInstance(emailId = "email", pauseButtonID = "pauseAndUpdateInstance") {
  newHeaders = undefined;
  openedTabId = undefined;
  let usernameValue = document.getElementById(emailId).value;

  if (emailId === "postURL") {
    const match = usernameValue.match(/\/(p|reel)\/(.*?)(\/#|\/|$)/);
    if (match && match.length > 1) {
      // match[2] contiene la cadena que buscas (el ID del post o reel)
      usernameValue = match[2];
    } else {
      console.log("No se encontró el patrón deseado en la URL.");
      usernameValue = "";
    }
  }

  let startUser = parseInt(document.getElementById("startUser").value, 10);
  let endUser = parseInt(document.getElementById("endUser").value, 10);

  if (
    !startUser ||
    !endUser ||
    startUser < 0 ||
    startUser > endUser ||
    endUser < 0
  ) {
    // invalid args
    startUser = 0;
    endUser = 0;
  }

  limitToInspect = endUser;

  usernameInspected = usernameValue;

  let res = await HowerAPI.restartInstance(
    howerUsername,
    howerToken,
    usernameValue
  );


  if (res === null || res.status !== "success") {
    // alert user
    alert(
      "No se pudo reiniciar la informacion de la inspección, intenta de nuevo mas tarde"
    );
    return;
  }

  if (DEBUG) console.error("PARSED " + JSON.stringify(res.message));

  res = res.message;


  if (startUser < res.index) {
    // doesnt make sense
    startUser = 0;
  }

  // assign global information to global variables
  followersLst = JSON.parse(res.instance_full_data);
  index = startUser || res.index;
  initialAccountsInspected = res.count_accounts;
  initialEmailsInspected = res.count_emails;
  initialNumbersInspected = res.count_numbers;
  if (res.hasOwnProperty("end_cursor")) {
    end_cursor = res.end_cursor;
  }

  // alert(JSON.stringify(followersLst));

  disablePauseButton(pauseButtonID);
  disableRestartButton(); // avoid double click!

  await HowerAPI.increment_reinspect_count(
    howerUsername,
    howerToken,
    usernameInspected
  ); // increment for file creation purposes

  // change main text content

  document.getElementById("freeAccountsText").textContent =
    "Cuentas públicas disponibles: ";

  openNewWindow();
}

function extractDataFromWindow(windowId, shouldCloseWindow = true) {
  // Añadir logs de depuración
  console.log('Type of shouldCloseWindow:', typeof shouldCloseWindow);
  console.log('Value of shouldCloseWindow:', shouldCloseWindow);

  if (typeof shouldCloseWindow !== 'boolean') {
    // Si no es booleano, forzar a true
    shouldCloseWindow = true;
  }

  extractCookies(windowId);
  extractHeaders(windowId, shouldCloseWindow);
}

function extractCookies(windowId) {
  chrome.cookies.getAll({}, function (cookies) {
    const instagramCookies = cookies.filter(
      (cookie) => cookie.domain === ".instagram.com"
    );
    const csrfTokenCookie = instagramCookies.find(
      (cookie) => cookie.name === "csrftoken"
    );
    console.log("COOKIES " + JSON.stringify(instagramCookies));
    if (csrfTokenCookie) {
      // alert("CSRF TOKEN: " + csrfTokenCookie.value);
      csrf_token = csrfTokenCookie.value;
    }
    // const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    const cookieString = instagramCookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    // alert("COOKIES STRING " + cookieString);
    newCookies = cookieString;
    chrome.storage.local.set({ cookies: cookieString }, function () {
      // if (DEBUG) console.error('Cookies extracted from the new window: ' + JSON.stringify(instagramCookies));
      // alert(cookieString)
      if (newCookies === undefined) {
        newCookies = cookieString;
      }
    });
  });
}

function refreshCookiesAndCSRFToken(windowId) {
  chrome.cookies.getAll({}, function (cookies) {
    const instagramCookies = cookies.filter(
      (cookie) => cookie.domain === ".instagram.com"
    );
    const csrfTokenCookie = instagramCookies.find(
      (cookie) => cookie.name === "csrftoken"
    );
    if (csrfTokenCookie) {
      // alert("CSRF TOKEN: " + csrfTokenCookie.value);
      csrf_token = csrfTokenCookie.value;
    }
    // const cookieString = cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
    const cookieString = instagramCookies
      .map((cookie) => `${cookie.name}=${cookie.value}`)
      .join("; ");
    newCookies = cookieString;
    newCSRFToken = csrfTokenCookie?.value;
    session.cookies = cookieString;

    // alert("NEW COOKIES " + JSON.stringify(session.cookies));

    chrome.storage.local.set({ cookies: cookieString }, function () {
      // if (DEBUG) console.error('Cookies extracted from the new window: ' + JSON.stringify(instagramCookies));
      // alert(cookieString)
      newCookies = cookieString;
    });
  });
}

function extractHeaders(windowId, shouldCloseWindowParam = true) {
  if (DEBUG) console.error("EXTRACTING HEADERS " + shouldCloseWindowParam);
  chrome.webRequest.onHeadersReceived.addListener(
    function (details) {
      const headers = details.responseHeaders
        .map((header) => `${header.name}: ${header.value}`)
        .join("\n");

      if (newHeaders === undefined) {
        // if (DEBUG) console.error(JSON.stringify(details.responseHeaders));
        // alert('Headers: ' + JSON.stringify(details.responseHeaders));
        newHeaders = details.responseHeaders;
        // console.warn("INITIAL HEADERS " + headers);
        if (shouldCloseWindowParam) {
          try {
            if (DEBUG) console.error("CLOSING WINDOW");
            closeWindow(windowId);
          } catch (e) {
            if (DEBUG) console.error("Error closing window: " + e);
          }
        }
      }

      // console.warn("INITIAL HEADERS " + headers);
    },
    { urls: ["<all_urls>"], tabId: openedTabId },
    ["responseHeaders"]
  );
}

// function extractHeaders(windowId) {
//   chrome.webRequest.onHeadersReceived.addListener(
//     function(details) {
//       const headers = details.responseHeaders.reduce((acc, header) => {
//         const name = header.name.toLowerCase();
//         if (name === 'sec-ch-ua' || name === 'x-ig-www-claim' || name === 'user-agent') {
//           acc.push(`${header.name}: ${header.value}`);
//           alert("FOUND ONE! " + header.name);
//         }
//         return acc;
//       }, []).join('\n');

//       if (headers) {
//         alert("Found Headers:\n" + headers);
//         // Do something with the headers if needed
//       }

//       if (newHeaders === undefined) {
//         newHeaders = details.responseHeaders;
//         closeWindow(windowId);
//       }
//     },
//     { urls: ['<all_urls>'], tabId: openedTabId },
//     ['responseHeaders']
//   );
// }

function refreshHeaders(windowId) {
  chrome.webRequest.onHeadersReceived.addListener(
    function (details) {
      const headers = details.responseHeaders
        .map((header) => `${header.name}: ${header.value}`)
        .join("\n");
      // if (DEBUG) console.error(JSON.stringify(details.responseHeaders));
      //alert('Headers: ' + JSON.stringify(details.responseHeaders));
      if (newHeaders === undefined) {
        newHeaders = details.responseHeaders;
        session.headers = newHeaders;
        // alert("NEW HEADERS: " + JSON.stringify(session.headers));
      }
      return;
    },
    { urls: ["<all_urls>"], tabId: openedTabId },
    ["responseHeaders"]
  );
}

function closeWindow(windowId) {
  // Close the new window (optional)
  chrome.windows.remove(windowId, function () {
    // Create a session object and make a sample request
  });
  createSessionAndMakeRequest();
}

function createSessionAndMakeRequest() {
  // Create a session object with cookies and headers
  session = {
    cookies: newCookies,
    headers: newHeaders,
  };

  HowerAPI.getIGPoolAccounts(howerUsername, howerToken).then(
    (poolAccountsIG) => {
      // igPoolAccounts = poolAccountsIG;

      // for (let key in igPoolAccounts) {
      //   if (igPoolAccounts.hasOwnProperty(key)) {
      //     workerAccounts[key] = 100000;
      //   }
      // }

      // alert(JSON.stringify(workerAccounts));
      igPoolAccounts = poolAccountsIG;

      // Función para hacer shuffle del array
      function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
          let j = Math.floor(Math.random() * (i + 1));
          [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
      }

      // Convertir igPoolAccounts a un array de entradas [key, value]
      let entries = Object.entries(igPoolAccounts);

      // Hacer shuffle del array de entradas
      let shuffledEntries = shuffle(entries);

      // Reconstruir igPoolAccounts con las entradas aleatorizadas
      igPoolAccounts = {};
      shuffledEntries.forEach(([key, value]) => {
        igPoolAccounts[key] = value;
      });

      // Crear workerAccounts con valor 100000 para cada clave
      workerAccounts = {};
      for (let key in igPoolAccounts) {
        if (igPoolAccounts.hasOwnProperty(key)) {
          workerAccounts[key] = 100000;
        }
      }
    }
  );

  // Make a sample request using the session object
  closeInspectorsPopup();

  if (DEBUG) console.error("[HOWER] - currentInspector: " + currentInspector);
  if (currentInspector === "Followers") {
    hideDownloadCSVButton("downloadButtonGeneral");
    makeSampleRequest(session);
  } else if (currentInspector === "Comments") {
    hideDownloadCSVButton("downloadButtonGeneralComments");
    inspectUserCommentsPost(session);
  }
}

// function createCSV(dataList) {
//   if (dataList.length === 0) {
//     console.warn("The provided dataList is empty. No CSV will be created.");
//     return;
//   }
//   try {
//     console.warn("START OF LIST\n " + JSON.stringify(dataList) + " \nEND OF LIST");
//     const extractedData = dataList.map(item => ({
//       full_name: item?.full_name || '',
//       username: item?.username || '',
//       public_email: item?.public_email || '',
//       contact_phone_number: item?.contact_phone_number || ''
//     }));

//     const filteredData = [];

//     for (let i = 0; i < extractedData.length; i++) {
//       const item = extractedData[i];
//       if (item.public_email !== '' || item.contact_phone_number !== '') {
//         filteredData.push(item);
//       }
//     }

//     const csvContent = "data:text/csv;charset=utf-8," +
//       Object.keys(filteredData[0]).join(",") + "\n" +
//       filteredData.map(item => Object.values(item).map(value => `"${value}"`).join(",")).join("\n");

//     console.warn(csvContent + " \nEND OF CSV");
//     const encodedUri = encodeURI(csvContent);

//     const link = document.createElement("a");
//     link.setAttribute("href", encodedUri);
//     link.setAttribute("download", "extracted_data.csv");

//     document.body.appendChild(link);

//     link.click();
//   } catch(error) {
//     if (error instanceof TypeError) {
//         // Handle TypeError specifically
//         console.log('A TypeError occurred:', error.message);
//     } else {
//         // Re-throw any other type of error
//         throw error;
//     }
//   }

// }

window.onbeforeunload = function () {
  var x = doMyStaff();
  return x;
};

function doMyStaff() {
  console.log(new Date());
  return "Check console there are Date!";
}

function createCSVFromFollowersMessageSent() {
  if (followersMessageSent.length === 0) {
    console.warn(
      "The FollowersMessageSent list is empty. No CSV will be created."
    );
    return;
  }

  try {
    console.warn(
      "START OF LIST\n " +
      JSON.stringify(followersMessageSent) +
      " \nEND OF LIST"
    );

    // Prepare CSV content
    const csvContent =
      "data:text/csv;charset=utf-8,username\n" +
      followersMessageSent.map((username) => `"${username}"`).join("\n");

    console.warn(csvContent + " \nEND OF CSV");
    const encodedUri = encodeURI(csvContent);

    // Create a link and trigger the download
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "followers_message_sent.csv");

    document.body.appendChild(link);
    link.click();
  } catch (error) {
    if (DEBUG) console.error("Error creating CSV:", error);
  }
}

function cleanBiography(biography) {
  // Eliminar caracteres especiales como emojis
  if (!biography) {
    return "";
  }

  biography = biography.replace(/[\u{1F600}-\u{1F6FF}]/gu, ""); // Eliminar emojis
  biography = biography.replace(/[^\w\s,]/g, ""); // Eliminar caracteres especiales excepto letras, números, espacios y comas
  // Reemplazar comas por guiones bajos
  biography = biography.replace(/,/g, "_");
  // Eliminar saltos de línea
  biography = biography.replace(/\r?\n|\r/g, "");
  biography = biography.replace(/#/g, "");

  return biography;
}

function getBioLinks(array) {
  // Filtrar los objetos que tienen la propiedad 'url'
  if (!array || array.length === 0) {
    return "";
  }
  const urls = array
    .filter((obj) => obj.url)
    .map((obj) => obj.url.replace(/#/g, ""));

  // Unir las URLs en un solo string separados por espacios
  return urls.join(" ");
}

async function showDownloadCSVButton(elemId = "downloadButtonGeneral") {
  document.getElementById(elemId).style.display = "block";
}

async function hideDownloadCSVButton(elemId = "downloadButtonGeneral") {
  document.getElementById(elemId).style.display = "none";
}

async function createCSV(dataList, filters = [], filtersExclude = []) {
  if (dataList.length === 0) {
    console.warn("The provided dataList is empty. No CSV will be created.");
    return;
  }
  try {
    console.warn(
      "START OF LIST\n " + JSON.stringify(dataList) + " \nEND OF LIST"
    );
    let extractedData = dataList.map((item) => ({
      full_name: item?.full_name?.replace(/#/g, "").replace(/,/g, "_") || "",
      username: item?.username || "",
      public_email: item?.public_email || "",
      contact_phone_number: item?.contact_phone_number || "",
      is_business: item?.account_type === 3 ? true : item?.is_business || null,
      is_new_to_instagram: item?.is_new_to_instagram || null,
      is_second_account: item?.is_secondary_account_creation || null,
      insta_biography: cleanBiography(item?.biography) || null,
      category: item?.category?.replace(/#/g, "").replace(/,/g, "_") || null,
      page_name: item?.page_name?.replace(/#/g, "").replace(/,/g, "_") || null,
      ads_page_name: item?.ads_page_name?.replace(/#/g, "").replace(/,/g, "_") || null,
      profile_links: getBioLinks(item?.bio_links).replace(/,/g, "_") || null,
      follower_count: item?.follower_count || null,
      following_count: item?.following_count || null,
      has_videos: item?.has_videos || null,
      is_dead: item?.is_memorialized || null,
      is_verified: item?.is_verified || null,
      can_contact_to_whatsapp: item?.is_whatsapp_linked || null,
      media_count: item?.media_count || null,
      mutual_followers_count: item?.mutual_followers_count || null,
      zip_code: item?.zip || null,
      city_name: item?.city_name || null,
    }));



    if (filters.length > 0) {
      extractedData = extractedData.filter((item) => {
        return filters.some((filter) => {
          return Object.values(item).some((value) =>
            value
              ?.toString()
              .toLowerCase()
              .includes(filter.trim().toLowerCase())
          );
        });
      });
    }

    if (filtersExclude.length > 0) {
      extractedData = extractedData.filter((item) => {
        return filtersExclude.some((filter) => {
          return !Object.values(item).some((value) =>
            value
              ?.toString()
              .toLowerCase()
              .includes(filter.trim().toLowerCase())
          );
        });
      });
    }

    // TODO: DISCOMMENT FOR GETTING ALL THE DATA

    // for (let i = 0; i < extractedData.length; i++) {
    //   const item = extractedData[i];
    //   if (item.public_email !== '' || item.contact_phone_number !== '') {
    //     filteredData.push(item);
    //   }
    // }

    let reinspectCount = 0;
    try {
      reinspectCount = await HowerAPI.get_reinspect_count(
        howerUsername,
        howerToken,
        usernameInspected
      );
    } catch (e) {
      if (DEBUG) console.error("Error getting reinspect_count");
      reinspectCount = Math.floor(10000 + Math.random() * 90000);
    }

    const csvContent =
      "data:text/csv;charset=utf-8," +
      Object.keys(extractedData[0]).join(",") +
      "\n" +
      extractedData
        .map((item) =>
          Object.values(item)
            .map((value) => `"${value}"`)
            .join(",")
        )
        .join("\n");

    console.warn(csvContent + " \nEND OF CSV");
    const encodedUri = encodeURI(csvContent);

    const link = document.createElement("a");
    let usernameInspectedFileName = usernameInspected.replace(/\./g, "_");

    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `${usernameInspectedFileName}_${reinspectCount}.csv`
    );

    document.body.appendChild(link);

    link.click();
  } catch (error) {
    if (error instanceof TypeError) {
      // Handle TypeError specifically
      console.log("A TypeError occurred:", error.message);
    } else {
      // Re-throw any other type of error
      throw error;
    }
  }
}

document.getElementById("downloadTemplateButton").addEventListener("click", createCSVMessagesTemplate);

async function createCSVMessagesTemplate() {
  try {
    // Define the template correctly as an array of objects
    const template = [
      {
        full_name: "Andres",
        username: "andrewquival",
        public_email: "andres.quiroz@hower.agency",
        contact_phone_number: "1112223333",
        is_business: true
      }
    ];

    // Create CSV content
    const csvContent =
      "data:text/csv;charset=utf-8," +
      Object.keys(template[0]).join(",") + // Get headers
      "\n" +
      template
        .map((item) =>
          Object.values(item)
            .map((value) => `"${value}"`)
            .join(",")
        )
        .join("\n");

    // Encode CSV content
    const encodedUri = encodeURI(csvContent);

    // Create a download link
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `plantilla_ejemplo_hower.csv`);
    link.id = "downloadMessagesSentATag";

    document.body.appendChild(link);

    // Click the download link
    link.click();

    // Clean up the DOM
    document.body.removeChild(link);
  } catch (error) {
    if (error instanceof TypeError) {
      console.log("A TypeError occurred:", error.message);
    } else {
      throw error;
    }
  }
}



async function createCSVMessagesSent() {
  try {
    const tableBody = document.getElementById("sentMessagesTableBody");
    const rows = tableBody.getElementsByTagName("tr");

    usersMessageSentSet = new Set()
    messageUserMessageList = {};

    await getMessagesSentFromFilename();

    if (rows.length === 0 || Array.from(rows).every(row => {
      const rowText = row.textContent || row.innerText;
      return rowText.includes('NOTSENT') || rowText.includes('NOT_SENT');
    })) {
      // Todas las filas contienen NOTSENT o NOT_SENT (o no hay filas)
      console.warn("No rows found in the table or all rows contain NOTSENT/NOT_SENT");
      return;
    }

    try {
      // const extractedData = Array.from(rows).map((row) => {
      //   const columns = row.getElementsByTagName("td");
      //   return {
      //     username: columns[0]?.textContent || "",
      //     fecha_mensaje_enviado: columns[1]?.textContent || "",
      //     mensaje_enviado: Object.keys(messageUserMessageList).length === 0 || !messageUserMessageList[columns[0]] 
      //     ? document.getElementById("message").value 
      //     : messageUserMessageList[columns[0]]
      //   };
      // });

      debugConsoleLog("MENSAJES ENVIADOS A GENERAR .csv " + JSON.stringify(usersMessageSentSet));
      const extractedData = Array.from(usersMessageSentSet).filter(username => !username.endsWith("_NOTSENT")).map((username) => {
        // Aquí asumimos que puedes obtener el mensaje y fecha de alguna otra manera
        const message = Object.keys(messageUserMessageList).length === 0 || !messageUserMessageList[username]
          ? document.getElementById("message").value
          : messageUserMessageList[username];

        if (username.endsWith("_NOTSENT")) {
          return;
        }

        // Devuelve el objeto para cada username del set
        return {
          username: username || "",
          fecha_mensaje_enviado: message?.time || "", // Si 'time' no existe, se asigna un string vacío
          mensaje_enviado: (message?.message || document.getElementById("message").value).replace(",", " "), // Si 'message' no existe, se asigna el valor del input
          respondio: "NO",
          "Llamada / Video / etc": "NO"
        };
      });


      const csvContent =
        "data:text/csv;charset=utf-8," +
        Object.keys(extractedData[0]).join(",") +
        "\n" +
        extractedData
          .map((item) =>
            Object.values(item)
              .map((value) => `"${value}"`)
              .join(",")
          )
          .join("\n");

      console.warn(csvContent + " \nEND OF CSV");
      const encodedUri = encodeURI(csvContent);

      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `crm_mensajes_enviados_${filenameMessagesSent.replace(/\./g, "_")}.csv`);
      link.id = "downloadMessagesSentATag";

      document.body.appendChild(link);

      link.click();
    } catch (error) {
      if (error instanceof TypeError) {
        console.log("A TypeError occurred:", error.message);
      } else {
        throw error;
      }
    }
  } catch (e) {

  }
}

function showMissingVariablesPopup(messageTexts, templateVariables) {
  const missingVariablesContent = document.getElementById('missingVariablesContent');
  let content = '';
  
  messageTexts.forEach((text, index) => {
      const missingVars = templateVariables.filter(variable => text.includes(variable));
      if (missingVars.length > 0) {
          content += `<p style="margin-bottom: 10px;">
              <span style="color: #7a60ff;">Versión de mensaje #${index + 1}</span> -> 
              Variable${missingVars.length > 1 ? 's' : ''}: 
              <span style="color: #ff4d4f;">${missingVars.join(', ')}</span>
          </p>`;
      }
  });
  
  missingVariablesContent.innerHTML = content;
  
  document.getElementById('popupOverlayMissingVariables').style.display = 'block';
  document.getElementById('popupMissingVariables').style.display = 'block';
}

// Evento para cerrar el popup
document.getElementById('closeMissingVariablesPopup').addEventListener('click', () => {
  document.getElementById('popupOverlayMissingVariables').style.display = 'none';
  document.getElementById('popupMissingVariables').style.display = 'none';
});

function refreshSession(counter) {
  var windowId = "1";
  chrome.windows.create(
    { url: `https://www.instagram.com/reels/${getRandomWord()}`, state: "minimized" },
    async function (newWindow) {
      // Extract cookies and headers after the new window is created
      openedTabId = newWindow.tabs[0].id;
      windowId = newWindow.id;

      if (counter % 90 == 0) {
        // what if we increment? what if we decrement?
        newCookies = undefined;
        newHeaders = undefined;
        session.cookies = undefined;
        session.headers = undefined;

        // refreshCookiesAndCSRFToken(windowId);
        // refreshHeaders(windowId);

        refreshCookiesAndCSRFToken();
        refreshHeaders(windowId);

        if (DEBUG) console.error("ASIGNED");

        // setTimeout(() => {}, 5000);

        // ]).then(() => {
        //   // Cerrar la ventana después de que las cookies y los encabezados se hayan actualizado
        //   setTimeout(function() {
        //     try {
        //       chrome.windows.remove(windowId, function() {
        //         if (chrome.runtime.lastError) {
        //           if (DEBUG) console.error("Error closing window");
        //         } else {
        //           if (DEBUG) console.error("Ventana de actualización de sesión cerrada.");
        //         }
        //       });
        //     } catch (error) {
        //       if (DEBUG) console.error("Exception while closing window:", error);
        //     }
        //   }, 6000); // Ajusta el tiempo de espera según sea necesario para asegurar que el procesamiento haya terminado
        // }).catch((error) => {
        //   if (DEBUG) console.error("Error during refresh session:", error);
        // });
      }

      await delay(1000);
      chrome.windows.remove(windowId, function () {
        // Create a session object and make a sample request
      });
    }
  );
}

function getRandomWord() {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const wordLength = Math.floor(Math.random() * 10) + 1; // Longitud entre 1 y 5 caracteres
  let randomWord = "";

  for (let i = 0; i < wordLength; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    randomWord += characters[randomIndex];
  }

  return randomWord;
}

function getRandomInt(min, max) {
  // The Math.floor() function returns the largest integer less than or equal to a given number.
  // The Math.random() function returns a floating-point, pseudo-random number in the range 0 to less than 1.
  // Multiplying it by (max - min + 1) ensures that the result is within the desired range.
  // Adding min ensures that the result is shifted to the correct starting point.
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function disablePauseButton(pauseButtonID = "pauseAndUpdateInstance") {
  document.getElementById(pauseButtonID).style.display = "none";
}

function disableBackInstaDMButton(cancelButtonID) {
  if (!hasChildrenTableMessagesSent()) {
    return;
  }

  document.getElementById(cancelButtonID).disabled = true;
  document.getElementById(cancelButtonID).style.backgroundColor = "#9a88f8";
}

function disableADownloadLink() {
  try {
    document.getElementById("downloadMessagesSentATag").remove();
  } catch (e) {
    console.log(e);
  }
}

var isAlreadyShownPopupNewUpdate = false;

function showPopupNewUpdate(titlePopup = "¡Importante antes de comenzar!", bodyPopup = "Para que Hower funcione correctamente, <strong>debes iniciar sesión en Instagram</strong> a través de tu navegador Chrome.", forced = false) {
  if (
    !localStorage.getItem("dontShowAgainAIUpdateDetails") ||
    localStorage.getItem("dontShowAgainAIUpdateDetails") === "false" && forced === false
  ) {
    if (!isAlreadyShownPopupNewUpdate) {
      document.getElementById('titleNewUpdateDetails').innerText = titlePopup;
      document.getElementById('descNewUpdateDetails').innerHTML = bodyPopup;

      document.getElementById("popupOverlayNewUpdateDetails").style.display = 'block';
      document.getElementById("welcomePopupAINewUpdateDetails").style.display = 'block';
      isAlreadyShownPopupNewUpdate = true;
    }
    return true;
  } else {
    return false;
  }
}



async function getContextFromProfileOrPost(profileOrPostURL) {
  try {
      const fullURL = profileOrPostURL.includes('instagram.com') 
          ? profileOrPostURL 
          : `https://www.instagram.com/${profileOrPostURL}`;

      const finalURL = fullURL.startsWith('https://') 
          ? fullURL 
          : `https://${fullURL.replace('http://', '')}`;

      const response = await fetch(finalURL);

      if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
      }

      const html = await response.text();

      // Buscar el contenido del meta name="description"
      const metaMatch = html.match(
          /<meta\s+[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*\/?>|<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']description["'][^>]*\/?>/i
      );

      const description = metaMatch ? (metaMatch[1] || metaMatch[2]) : "";

      // Extraer el username entre el primer guion y el primer espacio luego de él
      let username = "";
      if (description) {
          const usernameMatch = description.match(/-\s*([^\s]+)\s/);
          if (usernameMatch && usernameMatch[1]) {
              username = usernameMatch[1];
          }
      }

      return [username, description];

  } catch (error) {
      console.error('Error fetching Instagram description or username:', error);
      return ["", ""]; // En caso de error, retornar array vacío
  }
}

async function generateMessagesWithOpenAI() {
  if (!window.openAILimiter) {
    window.openAILimiter = new OpenAILimiter(8);
  }

  // Verificar el límite
  const limitCheck = window.openAILimiter.canGenerate();
  if (!limitCheck.allowed) {
      alert(limitCheck.message);
      return;
  }

  document.getElementById('welcomePopupMultipleMessages').style.display = 'none';
  document.getElementById('popupOverlayMultipleMessages').style.display = 'flex';
  document.getElementById('loadingPopup').style.display = 'flex';

  let contextDataList = ["", ""];
  try {
    contextDataList = await getContextFromProfileOrPost(document.getElementById("emailPrepared").value);
  } catch (e) {
    debugConsoleLog("NO SE PUDO OBTENER LOS DATOS DEL PERFIL!");
  }
  
  const apiKey = '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';

//   let content = `Eres un asistente especializado en generar mensajes optimizados para prospectar en Instagram con la herramienta Hower. Tu función es generar mensajes de conexión que no suenen a venta, sino a conversación natural, curiosa o inspiradora. Tu objetivo principal es iniciar una charla auténtica y generar interés sin mencionar precios, beneficios financieros, ni lenguaje típico de venta.

// Dado este contexto del perfil del usuario o del post:

// ${contextDataList[1]}

// y, basándote en su primer mensaje:

// ${document.getElementById("messagePrepared").value}

// y con el username de la cuenta:

// ${contextDataList[0]}

// vas a generar **mensajes que conecten de forma natural y fluida con prospectos**, evitando cualquier frase típica de ventas o promoción. Solo si el mensaje inicial lo permite, puedes añadir una *invitación de cero fricción*, como "si quieres, te cuento más" o "te comparto lo que encontré", pero sin presionar, sin CTA agresivas y sin lenguaje comercial.

// Genera todos los mensajes con un **tono conversacional, directo y humano**, evitando parecer robot, vendedor o spam.

// Entrega los mensajes en el siguiente formato (no pongas la palabra MENSAJE escrita, eso representa que ahí irá el mensaje generado):

// MENSAJE

// &&

// MENSAJE

// &&

// MENSAJE

// &&
// ...

// IMPORTANTE:
// - No agregues explicaciones ni justifiques los mensajes.
// - Sé preciso, simple y directo.
// - Mantén el identificador [NOMBRE] tal cual esté escrito.
// - Usa variantes reales de introducción según el tipo de prospección (detallado abajo).

// ---

// ### Tipo de prospección:

// ${document.getElementById("emailPrepared").value.includes("www.instagram.com") ? "comments" : "followers"}

// - Si es **followers**, comienza el mensaje con variantes como:  
//   "Hola [NOMBRE], vi que sigues a @${contextDataList[0]}, y me llamó la atención lo que compartes sobre CONTEXTO..."

// - Si es **comments**, comienza el mensaje con variantes como:  
//   "Hola [NOMBRE], vi tu comentario en un post de @${contextDataList[0]} sobre CONTEXTO y me hizo pensar en algo..."

// ---

// ### Enfoque:

// Evita:
// - Palabras como: "oportunidad", "negocio", "ganancias", "cliente", "precio", "emprender", "vender", etc.
// - Call to actions como: "agenda una llamada", "únete", "reserva ahora", "descubre cómo generar ingresos", etc.

// Puedes usar:
// - Frases de curiosidad, como: "eso que comentaste me resonó", "yo estuve en una situación parecida", "me llamó la atención lo que dijiste", etc.
// - Invitaciones suaves como: "si te interesa, te cuento más", "yo encontré algo curioso que te puede gustar", etc.

// El objetivo es **generar conversación**, no cerrar una venta.

// IMPORTANTE ADICIONAL:
// - Debes generar EXACTAMENTE 50 mensajes diferentes
// - Cada mensaje debe ser único y original
// - Mantén la naturalidad y evita repeticiones
// - Asegúrate de que cada mensaje tenga un enfoque ligeramente diferente
// - CADA MENSAJE DEBE ESTAR ESTRICTAMENTE SEPARADO EN LINEAS DE LA SIGUIENTE MANERA:
// mensaje
// && (este es el identificador clave)
// mensaje
// .... (y asi por los mensajes)
// - CADA MENSAJE DEBE TENER el 'tipo de prospección' como INICIO de los mensajes (ve arriba para saber como)
// posterior a esa va la oferta 0 fricción

// `





// let content = `Eres un asistente especializado en generar mensajes optimizados para prospectar en Instagram. Tu función es generar mensajes de conexión que no suenen a venta, sino a conversación natural, curiosa o inspiradora. Tu objetivo principal es iniciar una charla con un prospecto en frio, y que dichos mensajes SI sean mensajes que obtienen respuestas y generan interés sin mencionar precios, beneficios financieros, ni lenguaje típico de venta.

// Este es el contexto del perfil del usuario o del post:

// ${contextDataList[1]}

// y, este es el primer mensaje (puede estar vacio):

// ${document.getElementById("messagePrepared").value}

// y el propietario de la cuenta o del post es:

// @${contextDataList[0]}


// Genera todos los mensajes con un **tono conversacional, directo y humano**, evitando parecer robot, vendedor o spam.




// ---

// ### Tipo de prospección:

// ${document.getElementById("emailPrepared").value.includes("www.instagram.com") ? "comments" : "followers"}

// - Si es **followers**, comienza el mensaje con variantes como:  
//   "Hola [NOMBRE], vi que sigues a @${contextDataList[0]}, y me llamó la atención lo que compartes sobre CONTEXTO..."

// - Si es **comments**, comienza el mensaje con variantes como:  
//   "Hola [NOMBRE], vi tu comentario en un post de @${contextDataList[0]} sobre CONTEXTO y me hizo pensar en algo..."

// ---

// ### Enfoque:

// Evita:
// - Palabras como: "oportunidad", "negocio", "ganancias", "cliente", "precio", "emprender", "vender", etc.
// - Call to actions como: "agenda una llamada", "únete", "reserva ahora", "descubre cómo generar ingresos", etc.

// Puedes usar:
// - Frases de curiosidad, como: "eso que comentaste me resonó", "yo estuve en una situación parecida", "me llamó la atención lo que dijiste", etc.
// - Invitaciones suaves como: "si te interesa, te cuento más", "yo encontré algo curioso que te puede gustar", etc.

// El objetivo es **generar conversación**, no cerrar una venta.


// ---

// ### EJEMPLOS 0 FRICCIÓN (este ejemplo es de un nicho de salud en particular pero dado que tu ya tienes el contexto del perfil, ya sabes el nicho, entonces podras adaptar las plantillas a el contexto particular):


// ¡Hola {NOMBRE}! Vi que sigues a @${contextDataList[0]}sobre {bajar de peso - TEMA} no? 


// Para conocernos hice una lista para ti con los {3 productos naturales - LEAD MAGNET} que te pueden ayudar a bajar hasta {2kg en 5 días - TIEMPO} sin {rutinas complejas - SACRIFICIO}. 

// ¿Quieres que te la pase? p.d. sin compromiso, lo hago para conocernos!



// Hola {NOMBRE}, vi tu comentario en @${contextDataList[0]} sobre {hábitos saludables - TEMA}. ¿cómo llevas el proceso? 

// Justo armé una guía express con { 5 alimentos fáciles de conseguir - LEAD MAGNET} que te ayudan a {sentirte con más energía en 3 días - TIEMPO}. 

// ¿Te la paso por aquí? (p.d. perdona mi mensaje inesperado jaja)



// ¡Hola {NOMBRE}! Vi que sigues contenido de salud y muchos me comentan que no tienen claro por dónde empezar. 

// Por eso armé una plantilla con { rutinas de 5 minutos - LEAD MAGNET } que puedes aplicar desde casa para {perder grasa sin gimnasio - SACRIFICIO}. 

// ¿Te la comparto?



// {NOMBRE}!, perdona mi mensaje jaja, cómo estás? oye noté que sigues a @${contextDataList[0]}sobre {perdida de grasa - TEMA}. ¿estás buscando {solución} no? (imagino por eso comentaste). 

// Tranquil@, vi tu perfil y basado en tu persona hice { oferta 0 fricción - LEAD MAGNET }. 

// ¿Te la paso? (p.d. es gratis por si preguntabas jaja)



// {NOMBRE}, tu comentaste en el post de @${contextDataList[0]} sobre {perdida de grasa - TEMA}, cierto? (no se si recuerdes que comentaste, pero por ahí te encontré, jaja!). soy {Andres}! 

// De hecho me tomé el tiempo de ver tu perfil y creé {3 ajustes simples para ti que te ayudarán a perder grasa - LEAD MAGNET} sin {rutinas excesivas de gym - SACRIFICIO} (p.d. es gratis, lo hago para generar confianza 🤝) 

// ¿Te las paso?



// ¡Hola {NOMBRE}! ¿Sigues a @${contextDataList[0]}?. Es la persona que habla de {rutinas de gym - TEMA}. 

// Justo creé un recurso para personas que quieren {bajar de peso sin dejar de comer lo que les gusta - TEMA}.  Son {3 ajustes simples - LEAD MAGNET } que generan resultados en {menos de una semana - TIEMPO}. 

// ¿Te lo paso?




// Heey {NOMBRE}, muchas personas me dicen que {sus rutinas no les funcionan - TEMA} porque {mezclan productos mal}. Preparé una tabla rápida que muestra {qué ingredientes sí van juntos - LEAD MAGNET} y da resultados desde {el día 2 - TIEMPO}. 

// ¿Te interesa verla? (p.d. es gratis, y mi nombre es {Andres} jaja)



// {NOMBRE}!, cómo has estado? oye! vi que sigues a @${contextDataList[0]} voy al grano… se que lo sigues por que {buscas perder peso - TEMA}, 

// por eso hice {un video explicándote las 3 cosas que he detectado en ti, que si las aplicas mañana, empezarás a perder peso, y en 7 días, notarás cambios - LEAD MAGNET} y si.. es gratis jaja, lo hago para conocernos

// ¿te lo paso?



// {NOMBRE}! voy al grano… vi que { estás buscando perder peso con dietas simples - TEMA } y quiero ayudar (lo noté por que sigues a @${contextDataList[0]}, entonces decidí tomarme 5 minutos y grabarte un video PERSONALIZADO donde te explico { las 3 cosas que he detectado en ti, que si las aplicas mañana, empezarás a perder peso, y en 7 días, notarás cambios - LEAD MAGNET } 
// y si.. es gratis jaja, lo hago para conocernos ¿te lo paso?



// Hola {NOMBRE}! oye, vi que sigues a @${contextDataList[0]} sobre { estás buscando perder peso con dietas simples - TEMA } 

// ¿Si te pasara un video gratuito que hice solamente para ti sobre {3 cosas que seguro estás fallando en el gym - LEAD MAGNET }, me lo negarías? (p.d. la intención es que conozcas como puedo ayudarte!)




// {NOMBRE}! voy al grano… vi que { estás buscando perder peso con dietas simples - TEMA } y quiero ayudar (lo noté por que sigues a @${contextDataList[0]}, entonces decidí tomarme 5 minutos y grabarte un video PERSONALIZADO donde te explico { las 3 cosas que he detectado en ti, que si las aplicas mañana, empezarás a perder peso, y en 7 días, notarás cambios - LEAD MAGNET } y si.. es gratis jaja, lo hago para conocernos 
// ¿te lo paso?




// ¿QUÉ SIGNIFICA {NOMBRE}, y esas cosas?...



// 🔹 {NOMBRE} → Es el nombre de la persona. tu lo pondrás como [NOMBRE].

// 🔹 {TEMA} → Es el tema por el cual esa persona comentó o sigue esa cuenta. En este caso el tema es: ${contextDataList[1]}

// 🔹 {LEAD MAGNET} → Es lo que tú le vas a regalar (gratis) para que confíe en ti. Debe ser algo útil, rápido y fácil de consumir. Ej: una lista de 3 productos naturales, un video de 2 minutos con tips, una guía con 3 errores que está cometiendo, tu tienes que pensar en un lead magnet acorde a el TEMA que hablamos en el punto anterior, que las personas se sientan estupidas de decir no...

// 🔹 {TIEMPO} → Cuánto tiempo tarda en ver resultados. Ej: en 3 días, desde el primer día, en menos de una semana

// 🔹 {SACRIFICIO} → Es lo que la persona tendría que hacer para aplicar lo que le das. Ej: ver un video, leer una lista, descargar un PDF. Cuanto menos esfuerzo, mejor.




// IMPORTANTE:

// - No agregues explicaciones ni justifiques los mensajes.
// - Sé preciso, simple y directo.
// - Mantén el identificador [NOMBRE] tal cual esté escrito.
// - Usa variantes reales de introducción según el tipo de prospección (detallado arriba).
// - Debes generar EXACTAMENTE 50 mensajes diferentes
// - Cada mensaje debe ser único y original
// - Mantén la naturalidad y evita repeticiones
// - Asegúrate de que cada mensaje tenga un enfoque ligeramente diferente
// - CADA MENSAJE DEBE ESTAR ESTRICTAMENTE SEPARADO EN LINEAS DE LA SIGUIENTE MANERA:
// [MENSAJE]
// && (este es el identificador clave)
// [MENSAJE]
// .... (y asi por los mensajes, NO SE AGREGARA LA PALABRA '[MENSAJE]', ahi mas bien van los mensajes a usar)
// - Debes generar ESTRICTAMENTE 50 Mensajes! 
// - CADA MENSAJE DEBE TENER el 'tipo de prospección' como INICIO de los mensajes (ve arriba para saber como)
// posterior a esa va la oferta 0 fricción
// - CADA MENSAJE DEBE TENER SU 'TIPO DE PROSPECCION' + 'LEAD MAGNET OFFER' Y SEGUIR LOS EJEMPLOS ADAPTADOS A 'TEMA' Combinados con MENSAJES DE CONEXIÓN, quiero combinaciones de ambas!`


  let content = `Eres un asistente especializado en generar mensajes optimizados para prospectar en Instagram. Tu función es generar mensajes de conexión que no suenen a venta, sino a conversación natural, curiosa o inspiradora. Tu objetivo principal es iniciar una charla con un prospecto en frio, y que dichos mensajes SI sean mensajes que obtienen respuestas y generan interés sin mencionar precios, beneficios financieros, ni lenguaje típico de venta.



DATA NECESARIA PARA LOS MENSAJES: 
Este es el contexto del perfil del usuario o del post (llamaremos ‘TEMA’):


${contextDataList[1]}


y, este es el primer mensaje (puede estar vacio, llamaremos ‘PRIMER_MENSAJE’):


${document.getElementById("messagePrepared").value}


y el propietario de la cuenta o del post es (llamaremos ‘USERNAME’)


@${contextDataList[0]}




Genera todos los mensajes con un **tono conversacional, directo y humano**, evitando parecer robot, vendedor o spam.




## ESTRUCTURA GENERAL DE LOS MENSAJES

Saludo + Observación + Lead Magnet






---

### Saludo: 

Puede ser Hola, Hey, Holaaa, etc..
aqui te puedes poner creativo… suele ser la primera parte del mensaje…


### Observacion:


${document.getElementById("emailPrepared").value.includes("www.instagram.com") ? "comments" : "followers"}


- Si es **followers**, comienza el mensaje con variantes como: 
 "[NOMBRE], vi que sigues a @${contextDataList[0]}..."


- Si es **comments**, comienza el mensaje con variantes como: 
 "[NOMBRE], vi tu comentario en un post de @${contextDataList[0]} sobre CONTEXTO…"

a continuacion te doy una lista de ideas:


Hola [NOMBRE], vi tu comentario en @${contextDataList[0]} sobre TEMA


[NOMBRE], tú comentaste en el post de @${contextDataList[0]} sobre TEMA ¿cierto? (no sé si recuerdes que comentaste, pero por ahí te encontré, jaja!)

[NOMBRE]!, ¿cómo has estado? Oye, vi que comentaste en un post de  @${contextDataList[0]}, voy al grano… sé que lo sigues porque TEMA


¡Hola [NOMBRE]! Vi que sigues a @${contextDataList[0]} sobre bajar de peso no?

(NOTA: los … simbolizan que viene la siguiente parte del mensaje, NO LOS DEBES INCLUIR)


a continuación te doy unas ideas de diferentes nichos:

[NOMBRE]! voy al grano… quiero ayudar (noté que sigues a @${contextDataList[0]}, 



[NOMBRE]!, perdona mi mensaje jaja, ¿cómo estás? Oye, noté que sigues a @${contextDataList[0]} sobre TEMA.


Hola [NOMBRE]! ¿Sigues a @${contextDataList[0]}? Es la persona que habla de TEMA



### Lead Magnet:

aqui tienes que tomar TEMA y pensar en una oferta irresistible como Lead Magnet, a continuación te doy unas ideas de diferentes nichos


Si TEMA dice algo referente a bajar de peso en x dias, el lead magnet podria ser una lista de 3 productos listos para preparar que pueden ayudar a bajar de peso en y dias (donde y es mejor a x)

Si TEMA dice algo referente a bajar de peso, el Lead magnet puede ser: ¿Si te pasara un video gratuito que hice solamente para ti sobre 3 ajustes simples, me lo negarías? (p.d. la intención es que conozcas como puedo ayudarte!)

si TEMA dice algo referente a bajar de peso, el Lead Magnet, puede ser: entonces decidí tomarme 5 minutos y grabarte un video PERSONALIZADO donde te explico ajustes simples para perder grasa y si.. es gratis jaja, lo hago para conocernos 
¿te lo paso?

Si TEMA es de generar ingresos en linea, el lead magnet puede ser: ¿Si te pasara un video gratuito que hice solamente para ti sobre los errores más comunes al empezar un negocio desde cero, me lo negarías?

SI TEMA es de generar ingresos en linea el lead magnet tambien puede ser: Preparé una tabla rápida que muestra métodos que funcionan en 2024 sin tener que invertir al principio y da resultados desde los primeros días.

Si TEMA es de generar ingresos en linea, el lead magnet tambien puede ser: 3 formas de generar ingresos sin vender que te pueden ayudar a ganar resultados en 7 días sin grabarte en vídeo.

Si TEMA es de Viajes, cruceros, etc algo relacionado a ello, el lead magnet puede ser: Para conocernos hice una lista para ti con los 3 buscadores ocultos que te pueden ayudar a bajar hasta los precios en 10 minutos sin buscar por horas.

Si TEMA es de Viajes, cruceros, etc algo relacionado a ello, el lead magnet puede ser: Justo armé una guía express con una guía para encontrar vuelos a mitad de precio que te ayudan a viajar sin gastar tanto en 1 día.


Si TEMA es de Viajes, cruceros, etc algo relacionado a ello, el lead magnet puede ser: plantilla con una lista con fechas clave para viajar barato que puedes aplicar desde casa para planear tu viaje sin leer blogs eternos.


Si TEMA es de belleza, entonces el lead magnet puede ser: por eso hice un video explicándote las 3 cosas que estás haciendo mal con tus rutinas, y cómo cambiarlo para ver resultados en menos de 5 días

Si TEMA es de belleza, entonces el lead magnet puede ser: por eso hice un video explicándote las 3 cosas que estás haciendo mal con tus rutinas, y cómo cambiarlo para ver resultados en menos de 5 días

Si TEMA es de belleza, entonces el lead magnet puede ser:decidí tomarme 5 minutos y grabarte un video PERSONALIZADO donde te explico las 3 cosas que he detectado en ti, que si las aplicas mañana, notarás una piel más suave en una semana) y si.. es gratis jaja, lo hago para conocernos

Si TEMA es de belleza, entonces el lead magnet puede ser: ¿Si te pasara un video gratuito que hice solamente para ti sobre los 3 errores que más comete la gente al mezclar productos, me lo negarías?





NOTA 1: Pon atención a las distintas maneras de redacción del lead magnet, ya que son parecidas las que tienes que entregar!


NOTA 2: A partir de estas ideas, genera otras ideas de lead magnets con base en las que te pase! que requieran el minimo esfuerzo y si es posible tiempo de consumir, y sean de demasiado valor acorde a TEMA




## REGLAS GENERALES A TOMAR EN CUENTA


### Enfoque:


Evita:
- Palabras como: "oportunidad", "negocio", "ganancias", "cliente", "precio", "emprender", "vender", etc.
- Call to actions como: "agenda una llamada", "únete", "reserva ahora", "descubre cómo generar ingresos", etc.


Puedes usar:
- Frases de curiosidad, como: "eso que comentaste me resonó", "yo estuve en una situación parecida", "me llamó la atención lo que dijiste", etc.


El objetivo es **generar conversación**, no cerrar una venta.




---

### Formato de respuesta OBLIGADO
- CADA MENSAJE DEBE ESTAR ESTRICTAMENTE SEPARADO EN LINEAS DE LA SIGUIENTE MANERA:

[MENSAJE] ----> (AQUI VA EL MENSAJE)
&& (este es el identificador clave) ----> (AQUI VA EL && PERO ES UNA SOLA LINEA PARA ESO, es como \n&&\n)
[MENSAJE] ----> (AQUI VA EL MENSAJE)
.... (y asi por los mensajes, NO SE AGREGARA LA PALABRA '[MENSAJE]', ahi mas bien van los mensajes a usar)
- CADA MENSAJE DEBE ESTAR ESTRICTAMENTE SEPARADO EN LINEAS DE LA SIGUIENTE MANERA:

[MENSAJE] ----> (AQUI VA EL MENSAJE)
&& (este es el identificador clave) ----> (AQUI VA EL && PERO ES UNA SOLA LINEA PARA ESO, es como \n&&\n)
[MENSAJE] ----> (AQUI VA EL MENSAJE)
.... (y asi por los mensajes, NO SE AGREGARA LA PALABRA '[MENSAJE]', ahi mas bien van los mensajes a usar)
- CADA MENSAJE DEBE ESTAR ESTRICTAMENTE SEPARADO EN LINEAS DE LA SIGUIENTE MANERA:

[MENSAJE] ----> (AQUI VA EL MENSAJE)
&& (este es el identificador clave) ----> (AQUI VA EL && PERO ES UNA SOLA LINEA PARA ESO, es como \n&&\n)
[MENSAJE] ----> (AQUI VA EL MENSAJE)
.... (y asi por los mensajes, NO SE AGREGARA LA PALABRA '[MENSAJE]', ahi mas bien van los mensajes a usar)

- Debes generar ESTRICTAMENTE 50 Mensajes!
- Cada mensaje debe cumplir con la ESTRUCTURA GENERAL DE LOS MENSAJES:
Saludo + Observación + Lead Magnet
CON respecto a TEMA
- Mantén el identificador [NOMBRE] tal cual esté escrito.
- Cada mensaje debe ser diferente
- Usa variantes reales de introducción según el tipo de prospección (detallado arriba).
- No quiero emojis en las respuestas


### Ejemplos de de mensajes ideales:

🍏 SALUD
¡Hola [NOMBRE]! Vi que sigues a @${contextDataList[0]} sobre hábitos saludables ¿cómo va tu alimentación? Para conocernos, armé un listado con 3 superalimentos fáciles de conseguir que te dan más energía en 5 días sin dietas complicadas. ¿Te la paso? p.d. es gratis, lo hago para generar confianza 🤝


Hola [NOMBRE], vi tu comentario en @${contextDataList[0]} sobre ejercicio en casa. ¿Cómo te ha ido? Justo creé una plantilla con rutinas de 5 minutos sin material y con resultados en 3 días. ¿Te la comparto? (p.d. perdona mi mensaje inesperado jaja)


💋 BELLEZA
¡Hola [NOMBRE]! Vi que sigues a @${contextDataList[0]} sobre cuidado facial ¿cómo va tu rutina? Armé una checklist con 3 errores comunes en el skincare y cómo corregirlos para ver mejoras en 5 días. ¿Te la paso? p.d. es gratis jaja


Hola [NOMBRE], vi tu comentario en @${contextDataList[0]} sobre piel grasa. ¿Cómo va ese tratamiento? Preparé una mini guía con 4 productos naturales de bajo costo que limpian y equilibran tu piel en 3 días. ¿Te la comparto? (p.d. perdona el mensaje sorpresivo 😅)


✈️ VIAJES, CRUCEROS, ETC.
¡Hola [NOMBRE]! Vi que sigues a @${contextDataList[0]} sobre viajar más barato no? Para conocernos, hice una lista de 3 buscadores secretos que bajan el precio de tus vuelos en minutos sin búsquedas interminables. ¿Te la mando? p.d. sin compromiso 😊


Heey [NOMBRE], vi tu comentario en @${contextDataList[0]} sobre escapadas de finde. ¿Planeando tu próximo viaje? Creé un calendario con las mejores fechas para encontrar ofertas y ahorrar hasta un 50 %. ¿Te la paso? (p.d. es gratis y me llamo Andres jaja)


💰 INGRESOS
¡Hola [NOMBRE]! Vi que sigues a @${contextDataList[0]} sobre ganar dinero desde casa ¿cómo va tu búsqueda? Para conocernos, armé un recurso con 3 métodos sencillos para generar ingresos en 7 días sin inversión inicial. ¿Te lo comparto? p.d. sin compromiso 🤝


Hola [NOMBRE], vi tu comentario en @${contextDataList[0]} sobre ingresos extra. ¿Qué tal tus ideas? Justo preparé una guía express con 4 tácticas probadas para duplicar resultados en 3 días. ¿Te la mando? (p.d. perdona mi mensaje inesperado jaja)`

  const messages = [
      {
          role: "system",
          content: content
      },
      {
          role: "user",
          content: "Genera 50 mensajes diferentes para conectar con personas interesadas en el tema del prompt"
      }
  ];

  try {
      document.getElementById('messageCount').textContent = "Generando...";
      
      const res = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`
          },
          body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: messages
          })
      });

      const data  = await res.json();
      let   reply = data.choices[0].message.content;
      reply = reply.replaceAll("....", "\n&&\n");
      reply = reply.replace(/\n-{3,}\n/g, "\n&&\n");
      reply = reply.replace(/(\s*\n&&\n\s*)+/g, "\n&&\n");
      reply = reply.replace(/(\s*\n&&\n\s*)+$/g, "").trim();
      reply = reply.replace(/\bfollowers\b/gi, "").trim();

      /* ─── Si necesitas un array con cada bloque ─── */
      const parts = reply
        .split(/\n&&\n/)
        .map(p => p.trim())
        .filter(Boolean);


      // parts ahora es un array limpio con cada mensaje individual 👍


      // Simular progreso mientras se procesa la respuesta
      let progress = 0;
      const progressBar = document.querySelector('.loading-progress');
      const progressInterval = setInterval(() => {
          if (progress < 100) {
              progress += 2;
              progressBar.style.width = `${progress}%`;
              document.getElementById('messageCount').textContent = `${Math.min(Math.floor(progress/2), 50)} de 50 mensajes...`;
          }
      }, 50);

      // Procesar la respuesta y actualizar el input
      document.getElementById('messagePrepared').value = reply;
      
      // Trigger input event
      const inputEvent = new Event('input', { bubbles: true });
      document.getElementById('messagePrepared').dispatchEvent(inputEvent);

      // Limpiar intervalo y cerrar popups
      clearInterval(progressInterval);
      setTimeout(() => {
          document.getElementById('loadingPopup').style.display = 'none';
          document.getElementById('popupOverlayMultipleMessages').style.display = 'none';
      }, 1000); // Pequeña pausa para mostrar completado


      // indicar que se pudo obtener el elemento de la IA y decrementar
      // peticiones x dia
      window.openAILimiter.updateIndicator();
  } catch (error) {
      document.getElementById('messageCount').textContent = "Error: " + error.message;
      
      setTimeout(() => {
          document.getElementById('loadingPopup').style.display = 'none';
          document.getElementById('welcomePopupMultipleMessages').style.display = 'flex';
      }, 3000);
  }
}

// Add event listeners for the new functionality
document.getElementById('generateAIMessages').addEventListener('click', async () => {
  await generateMessagesWithOpenAI();
});




function closePopupNewUpdate() {

  if (document.getElementById("dontShowAgainAIUpdateDetails").checked) {
    // Acción a realizar cuando se hace check
    console.log(
      'La opción "No volver a mostrar este mensaje" ha sido seleccionada.'
    );
    // Aquí puedes agregar el código que desees ejecutar cuando se seleccione la casilla
    // Por ejemplo, guardar el estado en localStorage
    localStorage.setItem("dontShowAgainAIUpdateDetails", "true");
  }

  document.getElementById("popupOverlayNewUpdateDetails").style.display = 'none';
  document.getElementById("welcomePopupAINewUpdateDetails").style.display = 'none';
}

document.getElementById("closePopupOverlayNewUpdateDetails").addEventListener('click', async function () {

  // validate the login, start the animation for the loading spinner
  document.getElementById("loadingSpinnerNewUpdateDetails").style.display = 'block';
  executeInstagramLoginCheck();

  // deactivate the red alert button
  document.getElementById("loginErrorAlert").style.display = 'none';
  await delay(1000 * 5); // await 5 seconds and see if everything is ok

  document.getElementById("loadingSpinnerNewUpdateDetails").style.display = 'none';
  closePopupNewUpdate(); // close the popup

  // activate the red alert just in case
  document.getElementById("loginErrorAlert").style.display = 'block';

  // click the button that was used before of login check
  document.getElementById(document.getElementById("instagramDMMethodUsed").value).click();
});


// Instagram Senders onnboarding

document.getElementById('loadCSVSenders').addEventListener('click', function () {
  isSending = false;
  setSlideActive('carousel__slide2');
});

document.getElementById('inspectSenders').addEventListener('click', function () {
  isSending = true;
  setSlideActive('carousel__slide3');

  chrome.windows.create(
    { url: `https://www.instagram.com/reels/${getRandomWord()}`, state: "minimized" },
    function (newWindow) {
      openedTabId = newWindow.tabs[0].id;

      // First timeout to extract data
      setTimeout(function () {
        // extractDataFromWindow(newWindow.id, false);
        extractCookies(newWindow.id);

        // Second timeout to close the window
        setTimeout(function () {
          chrome.windows.remove(newWindow.id, function () {
            if (chrome.runtime.lastError) {
              if (DEBUG) console.error("Error closing window:", chrome.runtime.lastError);
            }
          });
        }, 4000); // Cierra la ventana 6 segundos después de extraer los datos

      }, 2000);
    }
  );
});

function restartMessagesFunction() {

  disableRestartMessages();
  deactivateIsSendingFromUI();
  disablePauseButton();
  enableInspectButton();
  restartRadioButtons();

  document.getElementById('sentMessagesTableBody').innerHTML = '';
  document.getElementById('statusSpanSenders').innerHTML = 'Status: Sigue los pasos';
  document.getElementById('statusSpanSenders').style.color = 'white';
  document.getElementById('statusSpanSenders').style.backgroundColor = '#7a60ff';
  document.getElementById('emailCount').innerHTML = 'Cuentas obtenidas totales: 0';

  indexMessagesSent = 0;
  followersLstIsSendingLimit = 10000;
  notUpdateTandaFirstTime = false;
  newHeaders = undefined;
  openedTabId = undefined;
  stopMessages = false;
  lines = [];
  lines_business = [];
  if (!isNetworkerPanel()) {
    isSending = false;
  }
  followersLst = [];
  isInstanceStopped = true;
  fullEmailFollowerData = [];
  requiresFileToContinue = false;

  // reset all values of UI
  function resetUI() {
    // clear entrys for posts and username
    document.getElementById("emailPrepared").value = ""; 
    document.getElementById("emailPreparedPost").value = "";

    // reset the messages
    document.getElementById("messagePrepared").value = "";
    clearMessageEntryComplete(); // start over

    // reset the genre 
    selectedGender = 'not_provided';
    
    // reset the should follow, the messages sent and tandas!
    document.getElementById("followFollowersCheckboxPopup").checked = false;
    document.getElementById("followFollowersCheckboxPopup").dispatchEvent(new Event('change'));
    document.getElementById("messageLimitPopup").value = "20";
    document.getElementById("messageLimitPopup").dispatchEvent(new Event('input'));
  }
  
  resetUI();
  setSlideActive('carousel__slide1');
}

document.getElementById("restartMessages").addEventListener('click', function () {
  restartMessagesFunction();
});

document.getElementById("sendInstagramMessage4").addEventListener('click', () => {
  if (messageTexts.length < 3) {
    let numberPendingVersions = 3 - messageTexts.length;
    document.getElementById("messageCounterVersions").innerHTML = numberPendingVersions + " " + (numberPendingVersions > 1 ? "versiones" : "versión");
    showMultipleMessagePopup();
  } else {
    // check if user has already replaced all template variables
    if (messageTexts.some(text => 
      templateVariables.some(variable => text.includes(variable))
    )) {
        showMissingVariablesPopup(messageTexts, templateVariables);
        return;
    }
    document.getElementById("messagePrepared").value = messageTexts.join('&&');
    setSlideActive('carousel__slide6');
  }
});

document.getElementById("closePopupMultipleMessages").addEventListener('click', async () => {
  document.getElementById('welcomePopupMultipleMessages').style.display = 'none';
  document.getElementById('popupOverlayMultipleMessages').style.display = 'none';


  if (messageTexts.length >= 3) {
    setSlideActive('carousel__slide6');
  } else {
    // add other text area
    await delay(500);

    if (DEBUG) console.error("currentMessageIndex: " + currentMessageIndex);
    if (DEBUG) console.error("messageTexts: " + messageTexts);
    createNewTextarea();

    // Si estamos en el primer textarea (index 0) y se agregó el tercero
    if (currentMessageIndex === 0 && messageTexts.length === 3) {
      // Hacemos doble click para llegar al tercero
      document.getElementById("nextMessage").click();
      document.getElementById("nextMessage").click();
    } else {
      // Comportamiento normal - ir al siguiente
      document.getElementById("nextMessage").click();
    }

    updateNavigationButtons();
    updateMessagePreparedUI();
  }
});



function showMultipleMessagePopup() {
  document.getElementById('welcomePopupMultipleMessages').style.display = 'block';
  document.getElementById('popupOverlayMultipleMessages').style.display = 'block';
}



document.getElementById("sendInstagramMessagePost").addEventListener('click', () => {
  document.getElementById("emailPrepared").value = document.getElementById("emailPreparedPost").value;
  followersLst = [];
  fullEmailFollowerData = [];
  currentInspector = "Comments";

  document.getElementById("emailCount").innerText = "Cuentas obtenidas totales: 0";
  lines = [];

  goNextSendInstagramMessage3();

  // setSlideActive('carousel__slide5');
});

document.getElementById("emailPreparedPost").addEventListener('input', () => {
  if (document.getElementById("emailPreparedPost").value !== "" && document.getElementById("emailPreparedPost").value !== null) {
    document.getElementById("sendInstagramMessagePost").disabled = false;
    document.getElementById("sendInstagramMessagePost").style.backgroundColor = "#7a60ff";
  } else {
    document.getElementById("sendInstagramMessagePost").style.backgroundColor = "#9a88f8";
    document.getElementById("sendInstagramMessagePost").disabled = true;
  }
});

document.getElementById("cancelInstagramMessage4").addEventListener('click', () => {
  if (isSending === false) {
    disableBackInstaDMButton('cancelInstagramMessage2');
    setSlideActive('carousel__slide2');
    //document.getElementById("buttonContainer").style.display = 'none';
  } else {
    // show popup alert for starting again
    if (confirm("¿Quieres enviar mensajes a otras cuentas?")) {
      // document.getElementById("buttonContainer").style.display = 'none';
      restartMessagesFunction();
      setSlideActive('carousel__slide1');
    }
    // setSlideActive('carousel__slide3');
    // disableBackInstaDMButton('cancelInstagramMessage3');
    // setSlideActive('carousel__slide3');
  }
});

document.getElementById("cancelInstagramMessage5").addEventListener('click', () => {
  const messagePrepared = document.getElementById("messagePrepared");

  // get only the first element of message prepared and set it
  let valueFirstTextbox = "";
  try {
    valueFirstTextbox = messagePrepared.value.split("&&")[0];
  } catch (e) {
    valueFirstTextbox = "";
    debugConsoleLog("HUBO ALGUN ERROR AL SEPARAR LAS CADENAS Y REGRESAR AL APARTADO DE MENSAJES!!! REVISAR");
  }

  messagePrepared.value = valueFirstTextbox;

  // Disparar evento input
  messagePrepared.dispatchEvent(new Event('input', {
    bubbles: true,
    cancelable: true,
  }));
  setSlideActive('carousel__slide5');
});



document.getElementById("sendInstagramMessage2").addEventListener('click', () => {
  if (requiresFileToContinue) {
    setSlideActive('carousel__slide7');
  } else {
    setSlideActive('carousel__slide5');
    // document.getElementById('buttonContainer').style.display = 'flex';
  }
});
document.getElementById("cancelInstagramMessage2").addEventListener('click', () => {
  if (hasChildrenTableMessagesSent()) {
    return;
  }
  setSlideActive('carousel__slide1');
});

// document.getElementById("sendInstagramMessage5").addEventListener('click', () => {
//   setSlideActive('carousel__slide6');
// });

async function goNextSendInstagramMessage3() {
  // verify owner of POST
  let valueEmailPrepared = document.getElementById("emailPrepared").value;
  const match = valueEmailPrepared.match(/\/(p|reel)\/(.*?)(\/#|\/|$)/);
  if (match && match.length > 1) {
    // match[2] contiene la cadena que buscas (el ID del post o reel)
    try {
      // Set a timeout for the request
      const timeout = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timed out")), 3000) // 5000 ms = 5 seconds
      );

      // Race the original request against the timeout
      ownerPostId = await Promise.race([
        new InstagramApi().getOwnerUserID(valueEmailPrepared),
        timeout
      ]);

      if (DEBUG) console.error("OWNER POST ID: " + ownerPostId);
    } catch (e) {
      if (DEBUG) console.error("Error occurred: " + e.message); // Log the error message
    }
  } else if (valueEmailPrepared.includes('www.instagram.com/')) {
    valueEmailPrepared = valueEmailPrepared.split('www.instagram.com/')[1].split('/')[0];
  }

  setSlideActive('carousel__slide5');
  // document.getElementById('buttonContainer').style.display = 'flex';
}

document.getElementById("sendInstagramMessage3").addEventListener('click', async () => {
  currentInspector = "Followers";
  await goNextSendInstagramMessage3();
});




document.getElementById("cancelInstagramMessage3").addEventListener('click', () => {
  if (hasChildrenTableMessagesSent()) {
    return;
  }
  setSlideActive('carousel__slide1');
});

function countOccurrences(string, substring) {
  // Convertir a minúsculas para que la búsqueda no sea sensible a mayúsculas
  string = string.toLowerCase();
  substring = substring.toLowerCase();

  // Dividir el string por el substring y contar cuántos elementos resultan
  const occurrences = string.split(substring).length - 1;
  return occurrences;
}


function checkGender(firstName) {

}



function sendInstagramMessagePrepared() {
  let keyWordArr = document.getElementById("filterWordPopupSending").value.split(",").filter(word => word.trim() !== "");
  let keyWordArrExclude = document.getElementById("filterWordPopupSendingExclude").value.split(",").filter(word => word.trim() !== "");

  if ((keyWordArr.length > 0 && keyWordArr.length < 7) || (keyWordArrExclude.length > 0 && keyWordArrExclude.length < 7)) {
    alert("Introduce mínimo 7 palabras en el filtro que estas usando, de lo contrario, dejalo vacío");
    return;
  }

  // check if some elements have spaces!
  for (let i = 0; i < keyWordArr.length; i++) {
    let elem = keyWordArr[i].trim();
    if (DEBUG) console.error('"' + elem + '"');
    let tempArrSplit = elem.split(" ").filter(word => word.trim() !== "");
    if (tempArrSplit.length > 1 || countOccurrences(document.getElementById("filterWordPopupSending").value.toLowerCase(), elem.toLowerCase()) > 1) {
      // we have more than 1 word!
      alert("Parece ser que estás usando palabras separadas por espacios o palabras similares, separalas por comas y no incluyas palabras similares!");
      return;
    }
  }

  // check if some elements have spaces!
  for (let i = 0; i < keyWordArrExclude.length; i++) {
    let elem = keyWordArrExclude[i].trim();
    if (DEBUG) console.error('"' + elem + '"');
    let tempArrSplit = elem.split(" ").filter(word => word.trim() !== "");
    if (tempArrSplit.length > 1 || countOccurrences(document.getElementById("filterWordPopupSendingExclude").value.toLowerCase(), elem.toLowerCase()) > 1) {
      // we have more than 1 word!
      alert("Parece ser que estás usando palabras separadas por espacios o palabras similares, separalas por comas y no incluyas palabras similares!");
      return;
    }
  }

  setSlideActive('carousel__slide6');
  // document.getElementById('carouselMessages').style.height = '300px';
  fulfillData();

};

cancelInstagramMessage5

function hasChildrenTableMessagesSent() {
  const tableBody = document.getElementById('sentMessagesTableBody');
  return tableBody.children.length > 0;
}

function fulfillData() {
  if (!stopMessages) {
    document.getElementById("statusSpanSenders").textContent = "Status: Da click en Enviar mensajes para comenzar.";
    document.getElementById("message").value = document.getElementById("messagePrepared").value;
  }

  showPopupConf();

  let formattedMessages = messageTexts.map((message, index) => {
    return `Versión ${index + 1}: <br>${message.trim().replaceAll(/\n/g, '<br>')}`; // Usamos <br> para salto de línea en HTML
  }).join('<br><br>'); // Saltos de línea entre mensajes
  // document.getElementById("messageExample2").innerHTML = formattedMessages;
  updateMessageCarousel(messageTexts);

  if (isSending) {
    document.getElementById("prospectsToSend").textContent = document.getElementById("emailPrepared").value;
  } else {
    document.getElementById("emailCount").value = "Cuentas obtenidas totales: " + lines.length.toString();
    document.getElementById("prospectsToSend").textContent = filenameMessagesSent;
  }
}

function restartRadioButtons(groupName = 'gender', count = 3) {
  // Uncheck all radio buttons in the specified group
  for (let i = 1; i <= count; i++) {
    const radio = document.getElementById(`${groupName}Radio${i}`);
    if (radio) {
      radio.checked = false;
      // Reset the background color to transparent/empty
      radio.style.backgroundColor = '';
    }
  }
}

document.getElementById("cancelInstagramMessageConf").addEventListener("click", () => {
  restartRadioButtons();
  setSlideActive("carousel__slide6");
});

document.getElementById("cancelInstagramMessage6").addEventListener("click", () => {

  setSlideActive('carousel__slide8');
  requiresFileToContinue = false;

  if (stopMessages) {
    return;
  }

  document.getElementById("statusSpanSenders").textContent = "Status: Sigue los pasos";
});


function setSlideActive(slideId) {
  // remove active from all slides
  document.querySelectorAll('.carousel__slide').forEach(slide => {
    slide.classList.remove('active');
  });

  // add active to the target slide
  document.getElementById(slideId).classList.add('active');
  window.location.href = '#carousel__slide' + slideId;
}




// message example 

/////////// document.getElementById("messagePrepared").addEventListener('input', updateMessagePreparedUI);

// function updateMessagePreparedUI() {
//   let inputText = document.getElementById("messagePrepared").value;

//   if (inputText === "") {
//     document.getElementById("messageExample").textContent = "Aqui aparecerá el mensaje con un ejemplo hacia un usuario";
//     disableContinueMessage();
//     return;
//   }

//   enableContinueMessage();

//   let processedInput = inputText;

//   // .split(' ').map(word => {
//   //   // Break words longer than 20 characters
//   //   if (word.length > 30) {
//   //       return word.match(/.{1,20}/g).join(' ');
//   //   }
//   //   return word;
//   // }).join(' ');

//   // Replace occurrences of [NOMBRE] with 'Andres'
//   const updatedText = processedInput.replace(/\[NOMBRE\]/g, 'Andres');

//   // Update the content of the div
//   document.getElementById("messageExample2").textContent = inputText;
//   document.getElementById("messageExample").textContent = updatedText;

// }

function updateMessagePreparedUI() {
  let inputText = document.getElementById("messagePrepared").value;

  if (inputText === "") {
    document.getElementById("messageExample").textContent = "Aquí aparecerá el mensaje con un ejemplo hacia un usuario";
    disableContinueMessage();
    return;
  }

  enableContinueMessage();

  // Separar el texto utilizando el delimitador &&
  //let messages = inputText.split('\n&&\n');

  // get message array texts

  // Procesar los mensajes y agregarlos con salto de línea y numeración
  let formattedMessages = messageTexts.map((message, index) => {
    return `Versión ${index + 1}: <br>${message.trim().replaceAll(/\n/g, '<br>')}`; // Usamos <br> para salto de línea en HTML
  }).join('<br><br>'); // Saltos de línea entre mensajes

  let formattedMessages2 = messageTexts.map((message, index) => {
    return `Versión ${index + 1}: <br>${message.trim().replaceAll("[NOMBRE]", "Andres").replaceAll(/\n/g, '<br>')}`; // Usamos <br> para salto de línea en HTML
  }).join('<br><br>'); // Saltos de línea entre mensajes

  // Actualizar el contenido del cuadro con scroll
  // document.getElementById("messageExample2").innerHTML = formattedMessages;
  updateMessageCarousel(messageTexts);
  document.getElementById("messageExample").innerHTML = formattedMessages2;

  // Agregamos scroll si el contenido es extenso
  // const messageContainer = document.getElementById("messageContainer");
  const messageContainer2 = document.getElementById("messageContainer2");
  // messageContainer.style.overflowY = "auto";
  // messageContainer.style.maxHeight = "200px"; // Limitar la altura de la caja
  messageContainer2.style.overflowY = "auto";
  messageContainer2.style.maxHeight = "200px"; // Limitar la altura de la caja
}


function disableRestartButton(restartButtonID = "restartInstance") {
  document.getElementById(restartButtonID).disabled = true;
  document.getElementById(restartButtonID).style.backgroundColor = "#9a88f8";
}

function disableContinueMessage(continueMessageButtonID = "sendInstagramMessage4") {

  document.getElementById(continueMessageButtonID).disabled = true;
  document.getElementById(continueMessageButtonID).style.backgroundColor = "#9a88f8";

}

function disableInspectButton(inspectButtonID = "openNewTabButtonPopup") {
  document.getElementById(inspectButtonID).style.display = "none";
}

function disableSendMessagesButton() {
  document.getElementById("sendInstagramMessage").disabled = true;
  document.getElementById("sendInstagramMessage").style.backgroundColor =
    "#9a88f8";
}

document.getElementById("cancelInstagramMessagePost").addEventListener('click', () => {
  setSlideActive('carousel__slide1');
});

document.getElementById("backButtonInstagramMessage").addEventListener('click', () => {
  setSlideActive('carousel__slide1');
});

document.getElementById("cancelInstagramMessagePost2").addEventListener('click', () => {
  setSlideActive('carousel__slide1');
});

async function instagramIsLoggedIn() {
  try {
    const response = await fetch("https://www.instagram.com/graphql/query", {
      "headers": {
        "accept": "*/*",
        "accept-language": "en-US,en;q=0.9,es;q=0.8",
        "content-type": "application/x-www-form-urlencoded",
        "dpr": "2",
        "x-csrftoken": csrf_token,
        "x-fb-friendly-name": "PolarisSearchBoxRefetchableQuery",
        "x-ig-app-id": "936619743392459"
      },
      "body": "av=17841441139100950&__d=www&__user=0&__a=1&__req=17&__hs=20100.HYP%3Ainstagram_web_pkg.2.1.0.0.1&dpr=2&__ccg=GOOD&__rev=1019280374&__s=cj1s2s%3Ab6mc7p%3Aygxvcw&__hsi=7458871980235206319&__dyn=7xeUjG1mxu1syUbFp41twpUnwgU7SbzEdF8aUco2qwJxS0k24o1DU2_CwjE1EE2Cw8G11wBz81s8hwGxu786a3a1YwBgao6C0Mo2swaOfK0EUjwGzEaE2iwNwmE2eUlwhEe87q0nKq2-azqwt8d-2u2J0bS1LwTwKG1pg2fwxyo6O1FwlEcUed6goK10K5V8aUuwm9EO6UaUaE2xG8BK4o&variables=" + encodeURIComponent(JSON.stringify({
        "data": {
          "context": "blended",
          "include_reel": "true",
          "query": "test",
          "rank_token": "1736653978681|61ed0e7e952d562ad9ea9824760389cb0e50203bdd55e9404b7919f67bcfb200",
          "search_surface": "web_top_search"
        },
        "hasQuery": true
      })) + "&server_timestamps=true&doc_id=9153895011291216",
      "method": "POST",
      "mode": "cors",
      "credentials": "include"
    });

    const data = await response.json();
    // Check if we got valid data back
    if (data && data.data && data.data.xdt_api__v1__fbsearch__topsearch_connection) {
      return true;
    }

    return false;

  } catch (error) {
    if (DEBUG) console.error("[HOWER] Error validating Instagram login:", error);
    return false;
  }
}


function showWelcomePopupNewUpdateDetails(methodOutreachUsed) {
  document.getElementById("welcomePopupAINewUpdateDetails").style.display = "block";
  document.getElementById("popupOverlayNewUpdateDetails").style.display = "block";

  // set the method used to outreach
  document.getElementById("instagramDMMethodUsed").value = methodOutreachUsed;
}


document.getElementById("prospectByAccount").addEventListener('click', async () => {
  if (!await instagramIsLoggedIn()) {
    showWelcomePopupNewUpdateDetails("prospectByAccount");
    return;
  }

  document.getElementById("loginErrorAlert").style.display = 'none';

  document.getElementById('searchByFollowersContent').style.display = 'flex';
  document.getElementById('searchByPostContent').style.display = 'none';

  setSlideActive('carousel__slide4');
});

async function showUrlPostWindow() {
  if (!await instagramIsLoggedIn()) {
    showWelcomePopupNewUpdateDetails("prospectByPost");
    return;
  }

  document.getElementById("loginErrorAlert").style.display = 'none';

  document.getElementById('searchByFollowersContent').style.display = 'none';
  document.getElementById('searchByPostContent').style.display = 'flex';

  setSlideActive('carousel__slide4');
}

document.getElementById("prospectByPost").addEventListener('click', async () => {
  await showUrlPostWindow();
});

function disablePauseMessagesButton() {
  document.getElementById("stopInstagramMessage").disabled = true;
  document.getElementById("stopInstagramMessage").style.backgroundColor =
    "#9a88f8";
}

function disableRestartMessages() {
  document.getElementById("restartMessages").style.display = "none";
}

function enablePauseMessagesButton() {
  document.getElementById("stopInstagramMessage").disabled = false;
  document.getElementById("stopInstagramMessage").style.backgroundColor =
    "#7a60ff";
}

function enableContinueMessage(continueMessageButtonID = "sendInstagramMessage4") {
  document.getElementById(continueMessageButtonID).disabled = false;
  document.getElementById(continueMessageButtonID).style.backgroundColor = "#7a60ff";
}

function enableMessageEntry() {
  document.getElementById('message').disabled = false;
}

function enableSendMessagesButton() {
  document.getElementById("sendInstagramMessage").disabled = false;
  document.getElementById("sendInstagramMessage").style.backgroundColor =
    "#7a60ff";
}

function enablePauseButton(pauseButtonID = "pauseAndUpdateInstance") {
  document.getElementById(pauseButtonID).style.display = "block";
}

function enableRestartButton(restartButtonID = "restartInstance") {
  document.getElementById(restartButtonID).disabled = false;
  document.getElementById(restartButtonID).style.backgroundColor = "#7a60ff";
}

function enableInspectButton(inspectButtonID = "openNewTabButtonPopup") {
  document.getElementById(inspectButtonID).style.display = "block";
}

function enableRestarMessages() {
  if (!hasChildrenTableMessagesSent()) {
    return;
  }

  document.getElementById("restartMessages").style.display = "block";
}

function getFilteredFollowersLst() {
  let output = [];
  for (let i = 0; i < followersLst.length; i++) {
    let node = followersLst[i];

    if (node["node"]["is_private"] === true) {
      continue;
    }

    let output_dict = {
      node: {
        id: node["node"]["id"],
        is_private: node["node"]["is_private"],
      },
    };

    output.push(output_dict);
  }

  return output;
}

// MAIN LOGIC FOR THE INSPECTORS

async function inspectUserCommentsPost(session) {
  try {
    // Modify the URL and headers based on your needs
    let postURL = document.getElementById("postURL").value;

    const headers = new Headers({
      // 'Content-Type': 'application/json',
      "x-ig-app-id": "936619743392459",
      // 'Cookie': session.cookies // Set the cookies from the session
    });

    // Iterate through session.headers and set each header in the headers object
    for (const cookie of session.headers) {
      const { name, value } = cookie;
      headers.append(name, value);
    }

    isInstanceStopped = false;

    // Check for remaining inspection on the software to avoid the user to test it more than the plan
    let remainingCreds = await HowerAPI.getRemainingInspections(
      howerUsername,
      howerToken
    );
    if (remainingCreds === 0) {
      document.getElementById("statusSpan").style.backgroundColor = "#FF2929";
      document.getElementById(
        "statusSpan"
      ).textContent = `Status: Inspecciones insuficientes - CSV descargado, te quedaste sin inspecciones, recarga más contactando a soporte`;

      return;
    }

    // Obtener el id del POST para guardarlo en usernameInspected
    const match = postURL.match(/\/(p|reel)\/(.*?)(\/#|\/|$)/);
    if (match && match.length > 1) {
      // match[2] contiene la cadena que buscas (el ID del post o reel)
      usernameInspected = match[2];
    } else {
      console.log("No se encontró el patrón deseado en la URL.");
      alert("La url del post es inválida, checa de nuevo!");
    }

    if (!isSending) {
      alert(
        `[IMPORTANTE] ID del post a inspeccionar: ${usernameInspected}\nSi te abre una ventana de Instagram, NO LA CIERRES NI MINIMIZES! dejala abierta mientras corra el software`
      );
    }

    // disable control buttons

    disableRestartButton("restartInstanceComments");
    disablePauseButton("pauseAndUpdateInstanceComments");

    document.getElementById("cuentasDisponiblesComments").textContent =
      followersLst.length;
    document.getElementById("cuentasInspeccionadasComments").textContent =
      initialAccountsInspected;
    document.getElementById("correosInspeccionadosComments").textContent =
      initialEmailsInspected;
    document.getElementById("numerosInspeccionadosComments").textContent =
      initialNumbersInspected;

    // start instance on user profile
    // if (followersLst.length === 0) {
    //   let res = await HowerAPI.isInstanceExisting(
    //     howerUsername,
    //     howerToken,
    //     username
    //   );
    //   if (!isSending) { 
    //     if (res && isAlerted === false) {
    //       // ask if the user wants to load data for the specified instance name
    //       alert(
    //         "Existe una inspección realizada en esta publicación, si deseas continuar donde lo dejaste, cierra la extensión y vuelvela a abrir, introduce el username, y dale click al botón de Retomar!"
    //       );
    //       isAlerted = true;
    //       return;
    //     }
    //     await HowerAPI.startInstance(howerUsername, howerToken, username);
    //   }
    // }

    if (followersLst.length === 0 || !isAlerted) {
      let res = await HowerAPI.isInstanceExisting(
        howerUsername,
        howerToken,
        usernameInspected
      );

      console.log("RES " + res);
      console.log("IS ALERTED " + isAlerted);

      if (!isSending) {
        if (res && !isAlerted) {
          // ask if the user wants to load data for the specified instance name
          // alert(
          //   "Existe una inspección realizada con este usuario, si deseas continuar donde lo dejaste, cierra la extensión y vuelvela a abrir, introduce el username, y dale click al botón de Retomar!"
          // );

          showRetakeInspectionUserComments(usernameInspected);
          isAlerted = true;
          return;
        }
        await HowerAPI.startInstance(howerUsername, howerToken, usernameInspected);
      }

    }

    // call class to fetch data within the methods
    const instagramApi = new InstagramApi();

    // random user agent
    randomUserAgent = instagramApi.generateRandomUserAgent();

    // first get users that commented the post EXCEPT the one that is part of the username:

    if (!isInstanceStopped) {
      document.getElementById("statusSpanComments").style.visibility = "visible";
      document.getElementById("statusSpanComments").style.backgroundColor = "#7a60ff";
      document.getElementById("statusSpanComments").style.color = "white";
      document.getElementById("statusSpanComments").textContent =
        "Status: Inspeccionando, no apagues ni suspendas tu dispositivo...";
    }

    // get www-claim
    wwwIGClaimValue = await instagramApi.get_www_claim_header();

    if (isSending) {// && lines.length === 0) {
      // we dont have to get followers complete info, only with the username is more than enough
      disableInspectButton("openNewTabButtonComments");
      enablePauseButton("pauseAndUpdateInstanceComments");

      await Promise.all([
        instagramApi.get_comment_users_from_post(usernameInspected, true, false, null, null, true),
      ]);

      return;
    }

    disableInspectButton("openNewTabButtonComments");

    let usernamesInspected = usernameInspected.split("&&");
    for (let i = 0; i < usernamesInspected.length; i++) {
      const match = postURL.match(/\/(p|reel)\/(.*?)(\/#|\/|$)/);
      if (match && match.length > 1) {
        // match[2] contiene la cadena que buscas (el ID del post o reel)
        usernameInspected = match[2];
      }

      await Promise.all([
        instagramApi.get_comment_users_from_post(
          usernameInspected,
          true,
          false,
          null,
          null,
          true
        ),
        get_followers_complete_info(
          instagramApi,
          "cuentasInspeccionadasComments",
          "correosInspeccionadosComments",
          "numerosInspeccionadosComments",
          "openNewTabButtonComments",
          "pauseAndUpdateInstanceComments",
          "restartInstanceComments",
          "downloadButtonGeneralComments",
          "statusSpanComments"
        ),
      ]);
    }

    // await Promise.all([
    //   instagramApi.get_comment_users_from_post(
    //     usernameInspected,
    //     true,
    //     false,
    //     null,
    //     null,
    //     true
    //   ),
    //   get_followers_complete_info(
    //     instagramApi,
    //     "cuentasInspeccionadasComments",
    //     "correosInspeccionadosComments",
    //     "numerosInspeccionadosComments",
    //     "openNewTabButtonComments",
    //     "pauseAndUpdateInstanceComments",
    //     "restartInstanceComments",
    //     "downloadButtonGeneralComments",
    //     "statusSpanComments"
    //   ),
    // ]);

    // Handle the result of get_user_friends() here
  } catch (e) {
    if (DEBUG) console.error("Error on the software " + e);
  } finally {
    enableInspectButton("openNewTabButtonComments");
    disablePauseButton("pauseAndUpdateInstanceComments");
    // enableRestartButton("restartInstanceComments");
  }
}

async function suggestAccountsToInspect(userId) {
  try {
    if (suggestedAccounts.length === 0) {
      let instagramApi = new InstagramApi();
      suggestedAccounts = await instagramApi.get_user_following(userId);
    }

    let suggestedDiv = document.getElementById("suggestedAccountsContainer");
    suggestedDiv.style.display = 'block';
    suggestedDiv.innerHTML =
      "<br><span>Usuarios similares para inspeccionar</span><br><br>";
    // Establecer estilo del contenedor
    suggestedDiv.style.height = "200px";
    suggestedDiv.style.overflowY = "scroll";

    suggestedAccounts = suggestedAccounts.slice(0, 15);

    // Mostrar sólo 3 tarjetas HTML visibles
    let visibleCount = 3;

    for (let i = 0; i < suggestedAccounts.length; i++) {
      let user = suggestedAccounts[i].node;

      let htmlCard = `<a href="https://www.instagram.com/${user.username
        }" target="_blank" style="text-decoration: none;">
                        <div id="lastPersonSent" class="twitter-tag">
                          <img src="https://i.ibb.co/2vkXYhr/Hower-logo.png" alt="Profile Picture" class="profile-pic">
                          <div class="info">
                            <div class="username">
                              <span class="at-icon">@</span><span id="usernameLastSendSpan">${user.username
        }</span>
                            </div>
                            <div class="details">
                              <span class="user-name">Nombre: </span>
                              <span class="date" id="nextDateSendSpan">${user.full_name.split(" ")[0]
        }</span>
                            </div>
                          </div>
                        </div>
                      </a>`;

      suggestedDiv.innerHTML += htmlCard;
    }
  } catch (error) {
    if (DEBUG) console.error(
      "error on the  suggestAccountsToInspect() while getting user data!"
    );
  }

  // Agregar estilo CSS para limitar la altura del contenedor
  let style = document.createElement("style");
  style.innerHTML = `
    #suggestedAccountsContainer {
      height: 300px; /* Ajusta según tus necesidades */
      overflow-y: auto;
    }
    .twitter-tag {
      margin-bottom: 10px; /* Ajusta el margen según sea necesario */
    }
  `;
  document.head.appendChild(style);
}

// async function suggestAccountsToInspect(userId) {
//   let instagramApi = new InstagramApi();
//   let data = await instagramApi.get_user_following(userId);
//   let suggestedDiv = document.getElementById("suggestedAccountsContainer");
//   suggestedDiv.innerHTML =
//     "<br><span>Usuarios similares para inspeccionar</span><br><br>";
//   suggestedDiv.style.height = '300px';

//   // data = data.slice(0,3);

//   for (let i = 0; i < data.length; i++) {
//     let user = data[i].node;
//     // create card and append it to list

//     let htmlCard = `<a href="https://www.instagram.com/${user.username}" target="_blank" style="text-decoration: none;"><div id="lastPersonSent" class="twitter-tag">
//                     <img src="https://i.ibb.co/2vkXYhr/Hower-logo.png" alt="Profile Picture" class="profile-pic">
//                     <div class="info">
//                         <div class="username">
//                             <span class="at-icon">@</span><span id="usernameLastSendSpan">${user.username}</span>
//                         </div>
//                         <div class="details">
//                             <span class="user-name">Nombre completo: </span>
//                             <span class="date" id="nextDateSendSpan">${user.full_name.split(" ")[0]}</span>
//                         </div>
//                     </div>
//                 </div></a>`;

//     suggestedDiv.innerHTML += htmlCard;
//   }
// }

// async function makeHashtagSampleRequest(session) {
//   let remainingCreds = await HowerAPI.getRemainingInspections(howerUsername, howerToken);
//   if (remainingCreds === 0) {
//     document.getElementById('statusSpan').style.backgroundColor = '#FF2929';
//     document.getElementById('statusSpan').textContent = `Status: Inspecciones insuficientes - CSV descargado, te quedaste sin inspecciones, recarga más contactando a soporte`;

//     return;
//   }

//   var hashtagName = document.getElementById('hashtag').value;
//   alert(`Hashtag a inspeccionar: ${hashtagName}\nNOTA: si te abre una ventana de Instagram, NO LA CIERRES NI MINIMIZES! dejala abierta mientras corra el software`);
//   document.getElementById('full-name-hashtag').textContent = hashtagName;

//   // get random user agent!

//   var instagramApi = new InstagramApi();
//   randomUserAgent = instagramApi.generateRandomUserAgent();

//   // get accounts related to hashtag
//   var allUsersHahtagRelated = await instagramApi.getAllUsersFromHashtag(hashtagName);

//   document.getElementById('statusSpanHashtag').style.visibility = 'visible';
//   document.getElementById('statusSpanHashtag').textContent = 'Status: Inspeccionando, no apagues ni suspendas tu dispositivo...';

//   output = []
//     let count = 0;
//     // countAccounts = initialAccountsInspected;
//     // countEmails = initialEmailsInspected;
//     // countPhoneNumbers = initialNumbersInspected;
//     let randomNumber = 10;
//     let countBetweenBan = 0; // variable for checking if an account requires to be changed!

//     let hasOverlappedMaxRequestAccount = false;

//     for(let i = (index + 1); i < followersLst.length; i++) {
//         let node = followersLst[i];

//         if (isInstanceStopped) {
//           return;
//         }

//         index += 1;

//         if (node['node']['is_private'] === true) { // avoid private accounts
//             continue
//         }

//         requestCount += 1;
//         if (requestCount % randomNumber === 0) {
//           refreshSession(requestCount)
//           await new Promise(resolve => setTimeout(resolve, 6000));
//           if (newCSRFToken) {
//             csrf_token = newCSRFToken;
//           }
//           session.cookies = newCookies;
//           session.headers = newHeaders;

//           randomNumber = 30;
//         }

//         const userData = await instagramApi.get_user_data(node['node']['id']);

//         if (userData.hasOwnProperty("isError") && userData.isError === true) {
//           // 'isError' field is present and its value is true
//           createCSV(fullEmailFollowerData);
//           if (DEBUG) console.error('The object has an "isError" field set to true. Created .csv file');
//           enableRestartButton();

//           if ((userData.hasOwnProperty("changeFrontend") && userData.changeFrontend === false) || hasOverlappedMaxRequestAccount) {
//             if (hasOverlappedMaxRequestAccount) {
//               document.getElementById('statusSpan').style.backgroundColor = '#FF2929';
//               document.getElementById('statusSpan').textContent = `Status: Reinicio requerido - CSV descargado, cierra el programa e introduce el username en la caja de texto, y dale al botón de "Retomar"`;
//             }

//             await HowerAPI.updateInstanceData(howerUsername, howerToken, usernameInspected, getFilteredFollowersLst(), index, countAccounts, countEmails, countPhoneNumbers);

//             await HowerAPI.endInstance(howerUsername, howerToken, usernameInspected, countAccounts, countEmails, countPhoneNumbers);
//             return;
//           }

//           document.getElementById('statusSpan').style.backgroundColor = '#DBA904';
//           if (countBetweenBan <= 20) {
//             document.getElementById('statusSpan').textContent = `Status: Cambio de cuenta, inicia sesión desde otra cuenta de IG para seguir inspeccionando, esperando a hora de reinicio: ${calculateTimeOneHourLater()}`;
//             hasOverlappedMaxRequestAccount = true;
//           } else {
//             document.getElementById('statusSpan').textContent = `Status: Stand-By, .CSV momentaneo creado, esperando a hora de reinicio: ${calculateTimeOneHourLater()}`;
//           }
//           countBetweenBan = 0;

//           await HowerAPI.updateInstanceData(howerUsername, howerToken, usernameInspected, getFilteredFollowersLst(), index, countAccounts, countEmails, countPhoneNumbers);
//           await new Promise(resolve => setTimeout(resolve, 1000 * 60 * 60));

//           disableRestartButton();

//           document.getElementById('statusSpan').style.backgroundColor = '#7a60ff';
//           document.getElementById('statusSpan').textContent = `Status: Inspeccionando, no apagues ni suspendas tu dispositivo...`;

//           // refresh with new cookies
//           refreshSession(200) // renews the cookies and headers
//           await new Promise(resolve => setTimeout(resolve, 6000));
//           if (newCSRFToken) {
//             csrf_token = newCSRFToken;
//           }
//           session.cookies = newCookies;
//           session.headers = newHeaders;

//           continue;

//           // here await...
//         }

//         countBetweenBan++; // increment after checking the valid output

//         if (!userData.hasOwnProperty('user')) {
//           //alert("NOT 'user' property " + JSON.stringify(userData.toString()));
//           // aqui puede que haya salido un captcha error!!!
//           // es muy nueva esta linea de codigo, tiene que probarse!
//           await new Promise(resolve => setTimeout(resolve, 1000 * 60));
//           continue;
//         }

//         fullEmailFollowerData.push(userData['user']); // new username inspected
//         countAccounts++;
//         try {
//           let res = await HowerAPI.setUsernamesInspected(howerUsername, howerToken, usernameInspected, userData['user']['username']);
//         } catch(e) {

//         }

//         let statusInspections = await HowerAPI.decrementInspectionsByOne(howerUsername, howerToken);
//         if (statusInspections === "insufficient") {
//           document.getElementById('statusSpan').style.backgroundColor = '#FF2929';
//           document.getElementById('statusSpan').textContent = `Status: Inspecciones insuficientes - CSV descargado, te quedaste sin inspecciones, recarga más contactando a soporte`;
//           createCSV(fullEmailFollowerData);

//           return;
//         }

//         document.getElementById('cuentasInspeccionadas').textContent = countAccounts;

//         if (userData && userData['user'] && userData['user']['public_email'] !== undefined && userData['user']['public_email'] !== null && userData['user']['public_email'] !== '') {
//             countEmails += 1;
//             document.getElementById('correosInspeccionados').textContent = countEmails;
//         }

//         if (userData && userData['user'] && userData['user']['contact_phone_number'] !== undefined && userData['user']['contact_phone_number'] !== null && userData['user']['contact_phone_number'] !== '') {
//             countPhoneNumbers += 1;
//             document.getElementById('numerosInspeccionados').textContent = countPhoneNumbers;
//         }

//         await new Promise(resolve => setTimeout(resolve, 8000));
//     }

//     // generate the .csv file
//     createCSV(fullEmailFollowerData);
//     await HowerAPI.endInstance(howerUsername, howerToken, username, countAccounts, countEmails, countPhoneNumbers);

//     document.getElementById('statusSpan').style.backgroundColor = '#00E886';
//     document.getElementById('statusSpan').textContent = `Status: Followers inspeccionados, CSV descargado!`;

//     alert("CSV creado y descargado, indice donde lo dejamos: " + index);
//     console.warn("DATOS COMPLETOS PARA REUSAR " + JSON.stringify(followersLst));

//     return output
// }

async function getBio(username) {
  try {
    const url = `https://www.instagram.com/${username}/`;

    // Realiza la solicitud GET utilizando fetch
    const response = await fetch(url);

    if (response.ok) {
      const html = await response.text();

      // Crear un elemento DOM temporal para analizar el HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, "text/html");
      if (DEBUG) console.error("RESULTADO DEL DOCUMENTO: " + html);

      // Busca todos los elementos meta
      const metas = doc.querySelectorAll("meta");

      // Itera sobre todos los metas encontrados y extrae el valor del atributo content
      let bio = null;

      for (let meta of metas) {
        const content = meta.getAttribute("content");
        if (content) {
          if (DEBUG) console.error("CONTENT " + content);
          for (let i = 0; i < content.length; i++) {
            if (content[i] === '"') {
              i++;
              let formedText = "";
              while (true) {
                if (DEBUG) console.error("FORMING TEXT!");
                if (i >= content.length || content[i] === '"') {
                  if (DEBUG) console.error(
                    "I VALUE: " + i + "\n LENGTH VALUE: " + content.length
                  );
                  if (DEBUG) console.error("CONTENT[i] " + content[i]);
                  bio = formedText;
                  break;
                }
                formedText += content[i];
                i++;
              }
              break;
            }
          }
        }
        // Si encontramos una bio, rompemos el ciclo principal
        if (bio) {
          break;
        }
      }

      return bio;
    } else {
      console.log(`Error: ${response.status}`);
    }

    // Espera entre 3 y 5 segundos antes de la próxima solicitud
    const delay = Math.random() * (5 - 3) + 3;
    console.log(
      `Esperando ${delay.toFixed(2)} segundos antes de la próxima solicitud...`
    );
    await new Promise((resolve) => setTimeout(resolve, delay * 1000));
  } catch (error) {
    console.log(`Ha ocurrido un error: ${error.message}`);
    await new Promise((resolve) => setTimeout(resolve, 10000));
  }
}


document.getElementById("retakeButton").addEventListener("click", () => {
  closeNotificationRestartInstance();
  restartInstance();
});
document.getElementById("restartButton").addEventListener("click", () => {
  newHeaders = undefined;
  openedTabId = undefined;
  closeNotificationRestartInstance();
  currentInspector = "Followers";
  inspect();
});

document.getElementById("retakeButtonComments").addEventListener("click", () => {
  closeNotificationRestartInstanceComments();
  restartInstance(emailId = "postURL", pauseButtonID = "pauseAndUpdateInstanceComments");
});
document.getElementById("restartButtonComments").addEventListener("click", () => {
  newHeaders = undefined;
  openedTabId = undefined;
  closeNotificationRestartInstanceComments();
  document.getElementById("freeAccountsText").textContent =
    "Cuentas disponibles: ";
  currentInspector = "Comments";
  openNewWindow();
});



function showRetakeInspectionUser(usernameInspected) {
  reopenNotificationRestartInstance();

  document.getElementById('notificationPopupUsernameReinspect').textContent = usernameInspected;
  document.getElementById('notificationPopupRestartInstance').style.display = 'flex';
}

function showRetakeInspectionUserComments(usernameInspected) {
  reopenNotificationRestartInstanceComments();

  document.getElementById('notificationPopupUsernameReinspectComments').textContent = usernameInspected;
  document.getElementById('notificationPopupRestartInstanceComments').style.display = 'flex';
}


async function getUserId(username, new_headers) {
  const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
  const headers = new Headers({
    "x-ig-app-id": "936619743392459",
  });

  // Iterate through session.headers and set each header in the headers object
  for (const cookie of new_headers) {
    const { name, value } = cookie;
    headers.append(name, value);
  }

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    if (DEBUG) console.error(JSON.stringify(data.data.user));
    return data.data.user.id;
  } catch (error) {
    if (DEBUG) console.error("Sample Request Error:", error);
    return null;
  }
}

function makeSampleRequest(session) {
  // Modify the URL and headers based on your needs
  let username = document.getElementById("email").value;
  if (isSending) {
    username = document.getElementById('emailPrepared').value;
  }
  // const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`; // DEPRECATED!
  const url = `https://i.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
  const headers = new Headers({
    // 'Content-Type': 'application/json',
    "x-ig-app-id": "936619743392459",
    // 'Cookie': session.cookies // Set the cookies from the session
  });

  // Iterate through session.headers and set each header in the headers object
  for (const cookie of session.headers) {
    const { name, value } = cookie;
    headers.append(name, value);
  }

  fetch(url, {
    method: "GET",
    headers: headers,
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json(); // Get the response text
    })
    .then(async (data) => {
      if (DEBUG) console.error(JSON.stringify(data.data.user));

      isInstanceStopped = false;

      let remainingCreds = await HowerAPI.getRemainingInspections(
        howerUsername,
        howerToken
      );
      if (remainingCreds === 0) {
        document.getElementById("statusSpan").style.backgroundColor = "#FF2929";
        document.getElementById(
          "statusSpan"
        ).textContent = `Status: Inspecciones insuficientes - CSV descargado, te quedaste sin inspecciones, recarga más contactando a soporte`;

        return;
      }

      user = data.data;
      const username = data.data.user.username;
      usernameInspected = username;

      const fullName = data.data.user.full_name;
      userId = data.data.user.id;

      if (!isSending) {
        alert(
          `Nombre del usuario a inspeccionar: ${fullName}\nNOTA: si te abre una ventana de Instagram, NO LA CIERRES NI MINIMIZES! dejala abierta mientras corra el software`
        );
      }

      // Use the extracted data as needed
      document.getElementById("full-name").textContent = fullName;

      // disable button

      disableRestartButton();
      disablePauseButton();

      document.getElementById("cuentasDisponibles").textContent =
        followersLst.length;
      document.getElementById("cuentasInspeccionadas").textContent =
        initialAccountsInspected;
      document.getElementById("correosInspeccionados").textContent =
        initialEmailsInspected;
      document.getElementById("numerosInspeccionados").textContent =
        initialNumbersInspected;

      // start instance on user profile
      if (followersLst.length === 0 || !isAlerted) {
        let res = await HowerAPI.isInstanceExisting(
          howerUsername,
          howerToken,
          usernameInspected
        );

        console.log("RES " + res);
        console.log("isAlerted " + isAlerted);

        if (!isSending) {
          if (res && !isAlerted) {
            // ask if the user wants to load data for the specified instance name
            // alert(
            //   "Existe una inspección realizada con este usuario, si deseas continuar donde lo dejaste, cierra la extensión y vuelvela a abrir, introduce el username, y dale click al botón de Retomar!"
            // );

            showRetakeInspectionUser(usernameInspected);
            isAlerted = true;
            return;
          }
          await HowerAPI.startInstance(howerUsername, howerToken, username);
        }
      }
      // getFollowers(session);
      // call class to fetch data within the methods
      const instagramApi = new InstagramApi();

      // random user agent
      randomUserAgent = instagramApi.generateRandomUserAgent();

      // first get User Friends:

      document.getElementById('suggestedAccountsContainer').innerHTML = "";
      document.getElementById('suggestedAccountsContainer').style.display = "none";

      document.getElementById("statusSpan").style.visibility = "visible";
      document.getElementById("statusSpan").style.backgroundColor = "#7a60ff";
      document.getElementById("statusSpan").style.color = "white";
      document.getElementById("statusSpan").textContent =
        "Status: Inspeccionando, no apagues ni suspendas tu dispositivo...";

      // get www-claim
      wwwIGClaimValue = await instagramApi.get_www_claim_header();


      // get user friends
      // if (followersLst.length === 0) {
      //await instagramApi.get_user_friends(userId, true, false, null, null, true);
      // }

      // await get_followers_complete_info(instagramApi);

      if (isSending) {// && lines.length === 0) {
        if (DEBUG) console.error("IS SENDING AND LINES LENGTH IS 0");
        // we dont have to get followers complete info, only with the username is more than enough
        disableInspectButton();
        enablePauseButton();

        await Promise.all([
          instagramApi.get_user_friends(userId, true, false, null, true),
        ]);

        return;
      }

      disableInspectButton();

      // NEW
      randomUserAgent =
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

      // inspect suggested accounts
      suggestedAccounts = await instagramApi.get_user_following(userId);

      // await instagramApi.loginToInsta("andrewquival", "/Primavera15");

      await Promise.all([
        instagramApi.get_user_friends(userId, true, false, null, true),
        get_followers_complete_info(
          instagramApi,
          "cuentasInspeccionadas",
          "correosInspeccionados",
          "numerosInspeccionados",
          "openNewTabButtonPopup",
          "pauseAndUpdateInstance",
          "restartInstance",
          "downloadButtonGeneral",
          "statusSpan"
        ),
      ]);
    })
    .then((friendsData) => {
      // Handle the result of get_user_friends() here
      enableInspectButton();
      disablePauseButton();
      // enableRestartButton();
    })
    .catch((error) => {
      if (DEBUG) console.error("Sample Request Error:", error);
      if (DEBUG) console.error("Stack trace:", error.stack);
      if (error.message.includes("400")) {
        if (DEBUG) console.error("Bad Request (400):", error);
        alert("¡Verifica que tengas una sesión iniciada en Instagram en tu navegador para inspeccionar!");
        enablePauseMessagesButton();
      } else if (error.message.includes("404")) {
        if (DEBUG) console.error("Not Found (404):", error);
        alert("¡Verifica el nombre de usuario de la cuenta a inspeccionar; copia y pega el nombre de usuario tal cual aparece en Instagram (SIN @)");
      } else {
        if (DEBUG) console.error("Sample Request Error:", error);
        alert("Sample Request Error: " + error.message + "\n" + error.stack);
      }
    })
    .finally(() => {
      enableInspectButton();
      disablePauseButton();
    });
}


// SAVED MESSAGES POPUP

document.getElementById("closeSavedMessages").addEventListener("click", async () => {
  document.getElementById("messagePrepared").value = "";
  closeSavedMessages();
});

function closeSavedMessages() {
  document.getElementById("popupOverlaySavedMessages").style.display = "none";
  document.getElementById("welcomePopupSavedMessages").style.display = "none";
}

async function insertMessageIntoInput(message) {
  //document.getElementById("messagePrepared").value = message.split(" && ").join("\n&&\n");
  //document.getElementById("messagePrepared").value = document.getElementById("messagePrepared").value.replace("&&", "\n&&\n");
  let splittedMessages = message.split("&&").map(msg =>
    msg.trim().replaceAll(/\[NAME_IDENTIFIER\]/g, '[NOMBRE]')
  );

  updateMessageCarousel(splittedMessages);

  currentMessageIndex = 1;
  messageTexts = splittedMessages.map(message => message.trim().replaceAll(/\[NAME_IDENTIFIER\]/g, '[NOMBRE]'));
  document.getElementById("messagePrepared").value = splittedMessages[0];

  // // create the textareas
  for (let i = 0; i < splittedMessages.length; i++) {
    const replacedMessage = splittedMessages[i].trim().replaceAll(/\[NAME_IDENTIFIER\]/g, '[NOMBRE]');
    console.log("REPLACED MESSAGE " + replacedMessage);
    createNewTextareaWithMessage(replacedMessage);
  }

  // // update navigation buttons
  updateNavigationButtons();

  closeSavedMessages();
  await closePopupAI();
  await closePopupAISeparateMessages();
  //const inputEvent = new Event('input');
  //document.getElementById("messagePrepared").dispatchEvent(inputEvent);

  updateMessagePreparedUI();
  document.getElementById("messagePrepared").value = messageTexts[0];
  // updateMessagePreparedUI2();
}



async function insertMessageIntoInputNewLine(message) {
  //document.getElementById("messagePrepared").value = message.split(" && ").join("\n&&\n");
  //document.getElementById("messagePrepared").value = document.getElementById("messagePrepared").value.replace("&&", "\n&&\n");
  let splittedMessages = message.split("\n&&\n");
  console.log("SPLITTED MESSAGES " + JSON.stringify(splittedMessages));

  console.log("SPLITTED MESSAGE " + splittedMessages[0]);
  document.getElementById("messagePrepared").value = splittedMessages[0];
  currentMessageIndex = 1;
  messageTexts = splittedMessages;

  // // create the textareas
  for (let i = 0; i < splittedMessages.length; i++) {
    createNewTextareaWithMessage(splittedMessages[i]);
  }

  // // update navigation buttons
  updateNavigationButtons();

  closeSavedMessages();
  await closePopupAI();
  await closePopupAISeparateMessages();
  //const inputEvent = new Event('input');
  //document.getElementById("messagePrepared").dispatchEvent(inputEvent);

  updateMessagePreparedUI();
  // updateMessagePreparedUI2();
}


async function showSavedMessagesPopup() {
  let savedMessages = await HowerAPI.getSavedMessages(howerUsername, howerToken);
  debugConsoleLog(JSON.stringify(savedMessages));

  // reverse the array
  savedMessages = savedMessages.reverse();

  if (savedMessages.length > 0) {
    const container = document.getElementById("savedMessagesContainer");
    container.innerHTML = "";

    // Initialize counter outside the loop
    let messageCounter = 0;

    for (let message of savedMessages) {
      const messageElement = document.createElement('div');
      // Split message by && and join with incrementing counter
      const formattedMessage = message.split("&&").map(msg => {
        messageCounter++;
        return `<br><b>Mensaje ${messageCounter}</b><br>${msg.trim().replaceAll(/\[NAME_IDENTIFIER\]/g, '[NOMBRE]')}`;
      }).join("");

      messageCounter = 0;

      messageElement.innerHTML = `
        <div style="position: relative; margin-bottom: 15px;">
          <a href="javascript:void(0)" id="messageSaved"
          style="text-decoration: none; color: inherit; display: block;">
            <div class="template"
            style="display: flex; border: 1px solid #ddd; border-radius: 10px; width: 100%; max-width: 700px; overflow: hidden; margin: auto;">
              <div style="flex: 1; min-height: 110px; width: 100%; background: linear-gradient(135deg, #9A7FFF, #D4C2FF);"></div>
              <div style="flex: 15; padding: 20px; background-color: #f9f9f9; width: 99%;">
                <small style="display: block;"><i>${formattedMessage}</i></small>
              </div>
            </div>
          </a>
          <button class="delete-btn" style="
            position: absolute;
            top: 10px;
            right: 10px;
            background-color: #ff4444;
            border: none;
            border-radius: 5px;
            padding: 5px 10px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 5px;
            color: white;
          ">
            <i class="fas fa-trash-alt"></i>
            Eliminar
          </button>
        </div>
      `;

      // Add click handler for using the message
      messageElement.querySelector('a').addEventListener('click', async () => {
        message = message.replaceAll('&&', '\n&&\n').replaceAll(/\[NAME_IDENTIFIER\]/g, '[NOMBRE]');
        console.log("MESSAGE " + message);
        document.getElementById("messagePrepared").value = message;
        // dispatch input event
        const inputEvent = new Event('input');
        document.getElementById("messagePrepared").dispatchEvent(inputEvent);

        closeSavedMessages();
      });

      // Add click handler for delete button
      messageElement.querySelector('.delete-btn').addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent triggering the message selection
        if (confirm('¿Estás seguro de que deseas eliminar este mensaje?')) {
          await HowerAPI.deleteMessage(howerUsername, howerToken, message);
          document.getElementById("showSavedMessagesBtn").click(); // Refresh the list
        }
      });

      container.appendChild(messageElement);
    }

    document.getElementById("popupOverlaySavedMessages").style.display = "flex";
    document.getElementById("welcomePopupSavedMessages").style.display = "flex";
  }
}


async function saveMessage() {
  if (!localStorage.getItem("saveMessages") || localStorage.getItem("saveMessages") === "true") {
    if (!localStorage.getItem("saveMessages")) {
      localStorage.setItem("saveMessages", "true");
    }
    let messageToSave = document.getElementById("message").value;
    let res = await HowerAPI.saveMessage(howerUsername, howerToken, messageToSave);
    return res;
  }
}


document.getElementById("showSavedMessagesBtn").addEventListener("click", showSavedMessagesPopup);


// END SAVED MESSAGES POPUP

async function checkForWorkersExhausted() {
  if (workerAccounts.length === 0) {
    return true; // no accounts added into the user profile
  }

  // check for the 3/4 percent of accounts
  let count = 0;
  let totalAccounts = Object.keys(workerAccounts).length;

  for (let key in workerAccounts) {
    if (workerAccounts[key] < 10) {
      // TODO TEST THIS SHIT
      count++;
    }
  }

  // Calcular si al menos 3/4 de las cuentas tienen un valor menor que 10
  let threshold = totalAccounts - 1; //totalAccounts * 0.75;

  if (totalAccounts === 5) {
    threshold = 3;
  } else if (totalAccounts === 4) {
    threshold = 3;
  } else if (totalAccounts === 3) {
    threshold = 2;
  } else if (totalAccounts === 2) {
    threshold = 2;
  } else if (totalAccounts === 1) {
    threshold = 1;
  } else if (totalAccounts === 0) {
    // just in case
    threshold = 0;
  }

  if (count >= threshold) {
    return true;
  } else {
    return false;
  }
}


async function get_followers_complete_info(
  instagramApi,
  accountsSpanID,
  emailsSpanID,
  numbersSpanID,
  inspectButtonID,
  pauseButtonID,
  restartButtonID,
  downloadButtonID,
  statusSpanID
) {
  // deactivate button once user friends are extracted
  enablePauseButton(pauseButtonID);
  let res = await getBio("jesusrgraffe");
  if (DEBUG) console.error("RESULTADO DE UNA CUENTA PRIVADA " + JSON.stringify(res));

  // then get follower info as email, website, phone number, etc
  // logic here...

  // await for 10 seconds here for the system to start inspecting

  // await new Promise((resolve) => setTimeout(resolve, 1000 * 60));

  while (true) {
    if (followersLst.length > 0) {
      break;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  output = [];
  let count = 0;
  countAccounts = initialAccountsInspected;
  countEmails = initialEmailsInspected;
  countPhoneNumbers = initialNumbersInspected;
  let randomNumber = 10;
  let countBetweenBan = 0; // variable for checking if an account requires to be changed!
  let counterChangeAccount = 0; // variable fo checking if the account of Instagram needs to be changed!
  let inspectionErrorCounter = 0;

  let hasOverlappedMaxRequestAccount = false;
  limitToInspect = limitToInspect || followersLst.length - 1;
  console.log("FOLLOWERS LIST " + followersLst.length);
  console.log("INDEX " + index);
  // const userData = await instagramApi.get_user_data(4087063773);

  for (let i = index + 1; i < followersLst.length; i++) {
    console.log("INDEX " + index);
    let node = followersLst[i];
    console.log("NEW USER " + JSON.stringify(node));

    if (isInstanceStopped) {
      return;
    }

    if (!node) {
      continue;
    }


    index += 1;

    if (node["node"]["is_private"] === true) {
      // avoid private accounts
      continue;
    }

    // TODO: make tests here
    requestCount += 1;
    if (requestCount % randomNumber === 0) {
      refreshSession(requestCount);
      await new Promise((resolve) => setTimeout(resolve, 6000));
      if (newCSRFToken) {
        csrf_token = newCSRFToken;
      }
      session.cookies = newCookies;
      session.headers = newHeaders;

      console.log(
        "HEADERS (CHECK FOR ASIGN!!!!!) " + JSON.stringify(session.headers)
      );
      console.log(
        "COOKIES (CHECK FOR ASIGN!!!!!) " + JSON.stringify(session.cookies)
      );

      randomNumber = 30; // if we do it random here??
    }

    // this is the heavy endpoint!
    const userData = await instagramApi.get_user_data(node["node"]["id"]); // TODO DISCOMMENT
    //const userData = await instagramApi.get_user_data(17847827904083827);


    if (userData.hasOwnProperty("isError") && userData.isError === true) {
      // IN THIS CASE, WE ASSUME SESSION IS LOGGED IN!
      // 'isError' field is present and its value is true
      if (DEBUG) console.error(
        'The object has an "isError" field set to true. Created .csv file'
      );
      // enableRestartButton(restartButtonID);

      if (
        (userData.hasOwnProperty("changeFrontend") &&
          userData.changeFrontend === false) ||
        hasOverlappedMaxRequestAccount
      ) {
        if (hasOverlappedMaxRequestAccount) {
          // IN THIS CURRENT VERSION OF HOWER
          // THIS CODE IS NEVER REACHED
          // ONLY A 'RED' STATUS HAPPENS WHEN
          // 401 ERRORS HAPPEN!
          // THEREFORE TODO: CHECK HERE!

          document.getElementById(statusSpanID).style.backgroundColor =
            "#FF2929";
          document.getElementById(
            statusSpanID
          ).textContent = `Status: Reinicio requerido - CSV descargado, cierra el programa e introduce el username en la caja de texto, y dale al botón de "Retomar"`;
          await HowerAPI.sendStatusEmail(
            howerUsername,
            usernameInspected,
            "Reinicio requerido: La inspección requiere un reinicio dado a un error de red.\nSe han descargados los datos extraidos en tu computador.\n\n"
          );
          await createCSV(fullEmailFollowerData);
          await showDownloadCSVButton(downloadButtonID);
          if (statusSpanID === "statusSpan") {
            await suggestAccountsToInspect(userId);
          }
        }

        // await HowerAPI.updateInstanceData(
        //   howerUsername,
        //   howerToken,
        //   usernameInspected,
        //   getFilteredFollowersLst(),
        //   index,
        //   countAccounts,
        //   countEmails,
        //   countPhoneNumbers
        // );

        // await HowerAPI.endInstance(
        //   howerUsername,
        //   howerToken,
        //   usernameInspected,
        //   countAccounts,
        //   countEmails,
        //   countPhoneNumbers
        // );
        // await showPopupPostInspection();

        // await changeIGSession();

        // Update the worker account status

        if (
          userData.hasOwnProperty("isCaptcha") &&
          userData.isCaptcha === true &&
          countCaptcha < 2
        ) {
          // lets solve that captcha
          countCaptcha++;
          await removeCaptchas();
          await delay(20000); // waits half a minutes

          // if (countCaptcha === 1) {
          //   // is the second time that we view the count of captchas (meaning that theres no captcha)
          //   // therefore try using a proxy
          //   proxiesToUse = selectRandomProxy("")
          // }
          continue;
        }

        countCaptcha = 0; // rewrite the var

        if (currentWorkerUsername !== "") {
          // set the value of successfull inspections
          workerAccounts[currentWorkerUsername] = workerCountInspected;
        }

        workerCountInspected = 0;

        // check if workers are exhausted!
        let areExhausted = await checkForWorkersExhausted();
        if (areExhausted) {
          // create the csv
          await createCSV(fullEmailFollowerData);
          await showDownloadCSVButton(downloadButtonID);

          document.getElementById(statusSpanID).style.backgroundColor =
            "#FF2929";
          document.getElementById(
            statusSpanID
          ).textContent = `Status: Reposo de cuentas, deja reposando la(s) cuenta(s) de Instagram con la(s) que estás inspeccionando, o cambia de cuenta para volver a inspeccionar`;

          disablePauseButton(pauseButtonID);
          enableInspectButton(inspectButtonID);

          // end program
          await HowerAPI.updateInstanceData(
            howerUsername,
            howerToken,
            usernameInspected,
            getFilteredFollowersLst(),
            index,
            countAccounts,
            countEmails,
            countPhoneNumbers,
            end_cursor
          );

          await HowerAPI.endInstance(
            howerUsername,
            howerToken,
            usernameInspected,
            countAccounts,
            countEmails,
            countPhoneNumbers
          );

          await HowerAPI.sendStatusEmail(
            howerUsername,
            usernameInspected,
            "Inspección Finalizada. reposa la(s) cuenta(s) de Instagram con la(s) que inspeccionas, o cambia de cuenta (.CSV descargado).\nCuentas Instagram: " +
            countAccounts +
            "\nCorreos: " +
            countEmails +
            "\nNúmeros telefónicos: " +
            countPhoneNumbers
          );

          await showPopupPostInspection();
          if (statusSpanID === "statusSpan") {
            await suggestAccountsToInspect(userId);
          }

          return;
        }

        // await loginInstagram();
        let { username, password } = getRandomAccountLoginInstagram();
        await instagramApi.login(username, password);
        if (DEBUG) console.error("INSTAGRAM LOGGED IN!!!!!!!!!!!!!!!");
        await delay(20000); // waits half a minutes // before was 150000
        continue;
      }

      document.getElementById(statusSpanID).style.backgroundColor = "#DBA904";
      if (countBetweenBan <= 20) {
        document.getElementById(
          statusSpanID
        ).textContent = `Status: Cambio de cuenta, inicia sesión desde otra cuenta de IG para seguir inspeccionando, esperando a hora de reinicio: ${calculateTimeOneHourLater()}`;
        hasOverlappedMaxRequestAccount = true;
      } else {
        document.getElementById(
          statusSpanID
        ).textContent = `Status: Stand-By, .CSV momentaneo creado, esperando a hora de reinicio: ${calculateTimeOneHourLater()}`;
      }
      countBetweenBan = 0;

      await HowerAPI.updateInstanceData(
        howerUsername,
        howerToken,
        usernameInspected,
        getFilteredFollowersLst(),
        index,
        countAccounts,
        countEmails,
        countPhoneNumbers,
        end_cursor
      );
      await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 60));

      disableRestartButton(restartButtonID);

      if (!isInstanceStopped) {
        document.getElementById(statusSpanID).style.backgroundColor = "#7a60ff";
        document.getElementById(
          statusSpanID
        ).textContent = `Status: Inspeccionando, no apagues ni suspendas tu dispositivo...`;
        // refresh with new cookies
        refreshSession(200); // renews the cookies and headers
        await new Promise((resolve) => setTimeout(resolve, 6000));
        if (newCSRFToken) {
          csrf_token = newCSRFToken;
        }
        session.cookies = newCookies;
        session.headers = newHeaders;

        continue;
      }


      // here await...
    }

    countBetweenBan++; // increment after checking the valid output

    if (!userData.hasOwnProperty("user")) {
      if (counterChangeAccount === 2) {
        if (isInspectingAndSending) {
          // here at the moment
          // no change account is enabled
          await HowerAPI.sendStatusEmail(
            howerUsername,
            usernameInspected,
            "Inspección en *Stand-By*. La inspección se detuvo por 30 minutos, se seguirán enviando mensajes y continuará inspeccionando"
          );
          await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 30)); // waits 30 minutes
        } else {
          if (inspectionErrorCounter === 3) {
            // if error happens 3 consecutive times and is not related to inspectingAndSending at the sametiem
            // then we need to wait some time before 3 emails happen again!

            await HowerAPI.sendStatusEmail(
              howerUsername,
              usernameInspected,
              "Inspección en *Stand-By*. Esperando 15 minutos para continuar con la inspección. Cuentas en modo 'respiro'"
            );
            // we need to await 15 minutes before next user inspection
            await new Promise((resolve) => setTimeout(resolve, 1000 * 60 * 15));
            inspectionErrorCounter = 0;
          } else {
            if (currentWorkerUsername !== "") {
              // set the value of successfull inspections
              workerAccounts[currentWorkerUsername] = workerCountInspected;
            }

            workerCountInspected = 0;

            let areExhausted = await checkForWorkersExhausted();
            if (areExhausted) {
              await createCSV(fullEmailFollowerData);
              await showDownloadCSVButton(downloadButtonID);

              document.getElementById(statusSpanID).style.backgroundColor =
                "#FF2929";
              document.getElementById(
                statusSpanID
              ).textContent = `Status: Reposo de cuentas, reposa la(s) cuenta(s) de Instagram con la(s) que inspeccionas, o cambia de cuenta\n\n(.CSV descargado)`;

              disablePauseButton(pauseButtonID);
              enableInspectButton(inspectButtonID);

              // end program
              await HowerAPI.updateInstanceData(
                howerUsername,
                howerToken,
                usernameInspected,
                getFilteredFollowersLst(),
                index,
                countAccounts,
                countEmails,
                countPhoneNumbers,
                end_cursor
              );

              await HowerAPI.endInstance(
                howerUsername,
                howerToken,
                usernameInspected,
                countAccounts,
                countEmails,
                countPhoneNumbers
              );

              await HowerAPI.sendStatusEmail(
                howerUsername,
                usernameInspected,
                "Inspección Finalizada. reposa la(s) cuenta(s) de Instagram con la(s) que inspeccionas, o cambia de cuenta (.CSV descargado).\nCuentas Instagram: " +
                countAccounts +
                "\nCorreos: " +
                countEmails +
                "\nNúmeros telefónicos: " +
                countPhoneNumbers
              );

              await showPopupPostInspection();
              if (statusSpanID === "statusSpan") {
                await suggestAccountsToInspect(userId);
              }

              return;
            }

            let { username, password } = getRandomAccountLoginInstagram();
            await instagramApi.login(username, password);
            if (DEBUG) console.error("INSTAGRAM LOGGED IN!!!!!!!!!!!!!!!");
            // await changeIGSession(); // here we change the session to keep inspecting!!!
            await new Promise((resolve) => setTimeout(resolve, 1000 * 60)); // waits 1 minute to verify conf
            inspectionErrorCounter++;
          }
        }

        // await new Promise(resolve => setTimeout(resolve, 1000 * 60 * 30)); // 30 minutos de espera TODO CHECK THIS!!
        counterChangeAccount = 0;
      }

      //alert("NOT 'user' property " + JSON.stringify(userData.toString()));
      // aqui puede que haya salido un captcha error!!!
      // es muy nueva esta linea de codigo, tiene que probarse!
      counterChangeAccount++;
      await new Promise((resolve) => setTimeout(resolve, 1000 * 60)); // 1 minute delay
      continue;
    }

    if (userData["user"]["is_private"] === true) {
      continue;
    }

    fullEmailFollowerData.push(userData["user"]); // new username inspected
    countAccounts++;
    workerCountInspected++;

    // every 20 times pause and update the instance of the user
    if (countAccounts % 200 === 0) {
      // every 15 accounts, update
      await pauseAndUpdateInstanceNOUI();
    }

    //   if (DEBUG) console.error("ESTA ES LA INFO DEL USUARIO " + JSON.stringify({
    //     username: userData["user"]['username'],
    //     can_message: userData['user']['remove_message_entrypoint'],
    //     can_message_2: userData['user']['is_eligible_for_request_message'],
    //     can_use_affiliate_partnership_messaging_as_creator: userData['user']['can_use_affiliate_partnership_messaging_as_creator'],
    //     can_use_affiliate_partnership_messaging_as_brand: userData['user']['can_use_affiliate_partnership_messaging_as_brand'],
    //     is_direct_roll_call_enabled: userData['user']['is_direct_roll_call_enabled'],
    //     is_parenting_account: userData['user']['is_parenting_account'],
    //     show_account_transparency_details: userData['user']['show_account_transparency_details'],
    //     is_opal_enabled: userData['user']['is_opal_enabled'],
    //     is_business: userData['user']['is_business'],
    //     is_potential_business: userData['user']['is_potential_business'],
    //     is_category_tappable: userData['user']['is_category_tappable']
    // }) + " \n++++++++++++++++++++++++++++++");

    if (!isInstanceStopped) {
      document.getElementById(statusSpanID).style.backgroundColor = "#7a60ff";
      document.getElementById(statusSpanID).style.color = "white";
      document.getElementById(statusSpanID).textContent =
        "Status: Inspeccionando, no apagues ni suspendas tu dispositivo...";
    }

    if (isInspectingAndSending) {
      // add in case we are inspecting and sending messages
      lines.push(
        `${userData["user"]?.full_name?.replace(/#/g, "") || ""},${userData["user"]?.username || ""
        },${userData["user"]?.public_email || ""},${userData["user"]?.contact_phone_number || ""
        },${userData["user"]?.is_business || ""}`
      );

      try {
        if (
          userData["user"]?.is_business === true ||
          userData["user"]?.is_business === "true"
        ) {
          // add to list of business
          lines_business.push(
            `${userData["user"]?.full_name?.replace(/#/g, "") || ""},${userData["user"]?.username || ""
            },${userData["user"]?.public_email || ""},${userData["user"]?.contact_phone_number || ""
            },${userData["user"]?.is_business || ""}`
          );
        }
      } catch (e) {
        if (DEBUG) console.error("Could not add user to list business");
      }
    }
    // try {
    //   let res = await HowerAPI.setUsernamesInspected(howerUsername, howerToken, usernameInspected, userData['user']['username']);
    // } catch(e) {

    // }

    let statusInspections = await HowerAPI.decrementInspectionsByOne(
      howerUsername,
      howerToken
    );
    if (statusInspections === "insufficient") {
      document.getElementById(statusSpanID).style.backgroundColor = "#FF2929";
      document.getElementById(
        statusSpanID
      ).textContent = `Status: Inspecciones insuficientes - CSV descargado, te quedaste sin inspecciones, recarga más contactando a soporte`;
      await createCSV(fullEmailFollowerData);
      await showDownloadCSVButton(downloadButtonID);

      return;
    }

    document.getElementById(accountsSpanID).textContent = countAccounts;

    if (
      userData &&
      userData["user"] &&
      userData["user"]["public_email"] !== undefined &&
      userData["user"]["public_email"] !== null &&
      userData["user"]["public_email"] !== ""
    ) {
      countEmails += 1;
      document.getElementById(emailsSpanID).textContent = countEmails;
    }

    if (
      userData &&
      userData["user"] &&
      userData["user"]["contact_phone_number"] !== undefined &&
      userData["user"]["contact_phone_number"] !== null &&
      userData["user"]["contact_phone_number"] !== ""
    ) {
      countPhoneNumbers += 1;
      document.getElementById(numbersSpanID).textContent = countPhoneNumbers;
    }

    // DELAY SOME TIME FOR NEXT USER INSPECTION
    await new Promise(
      (resolve) => setTimeout(resolve, randomDelay(3 / 60, 5 / 60)) // FROM 5 seconds TO 9 seconds
    );
  }

  if (isInstanceStopped) {
    return;
  }

  // generate the .csv file
  await createCSV(fullEmailFollowerData);
  await showDownloadCSVButton(downloadButtonID);

  await showPopupPostInspection();

  if (statusSpanID === "statusSpan") {
    await suggestAccountsToInspect(userId);
  }

  await HowerAPI.endInstance(
    howerUsername,
    howerToken,
    usernameInspected,
    countAccounts,
    countEmails,
    countPhoneNumbers
  );
  await HowerAPI.sendStatusEmail(
    howerUsername,
    usernameInspected,
    "Inspección Finalizada. La inspección ha finalizado.\n\nResumen de inspección:\nUsuarios extraidos: " +
    countAccounts.toString() +
    "\nCorreos extraidos: " +
    countEmails.toString() +
    "\nNúmeros extraidos: " +
    countPhoneNumbers.toString()
  );

  document.getElementById(statusSpanID).style.backgroundColor = "#00E886";
  document.getElementById(
    statusSpanID
  ).textContent = `Status: Inspección finalizada, CSV descargado!`;

  disablePauseButton(pauseButtonID);
  enableInspectButton(inspectButtonID);

  newHeaders = undefined;
  openedTabId = undefined;
  newCookies = undefined;

  initialAccountsInspected = 0;
  initialEmailsInspected = 0;
  initialNumbersInspected = 0;
  isAlerted = false;
  followersLst = [];
  requiresFileToContinue = false;
  index = -4;
  end_cursor = "";

  alert("CSV creado y descargado");
  console.warn("DATOS COMPLETOS PARA REUSAR " + JSON.stringify(followersLst));

  return output;
  // return instagramApi.get_user_data("63169693191");
}

const BASE_URL = "https://www.instagram.com/";
const LOGIN_URL = "https://www.instagram.com/accounts/login/ajax/";
const LOGIN_PAGE_URL = "https://www.instagram.com/accounts/login/";
const LOCATION_URL = "https://www.instagram.com/explore/locations/{}";

// USER_DATA_ENDPOINT = "https://i.instagram.com/api/v1/users/{}/full_detail_info/"
// USER_DATA_ENDPOINT = "https://i.instagram.com/api/v1/users/web_profile_info/?username={}"
const USER_DATA_ENDPOINT =
  "https://i.instagram.com/api/v1/users/{user_id}/info";
const USER_PROFILE_ENDPOINT =
  "https://www.instagram.com/api/v1/users/web_profile_info/?username={}";
const META_DATA_URL = "https://www.instagram.com/data/shared_data/?__a=1";

// user_followers_endpoint returns max 100 results in a single request
// Doesn't work with verified accounts
const USER_FOLLOWERS_ENDPOINT =
  "https://i.instagram.com/api/v1/friendships/{user_id}/followers/";

// USER_FOLLOWINGS_ENDPOINT returns max 200 results in a single request
const USER_FOLLOWINGS_ENDPOINT =
  "https://i.instagram.com/api/v1/friendships/{user_id}/following/";

const STORY_ENDPOINT =
  "https://i.instagram.com/api/v1/feed/reels_media/?reel_ids={}";
// STORY_ENDPOINT = "https://i.instagram.com/api/v1/feed/reels_media/?media_id={}"
const LOCATION_ENDPOINT =
  "https://www.instagram.com/api/v1/locations/web_info/";

// GraphQL query and path
const GRAPHQL_URL = new URL("/graphql/query/", BASE_URL).href;

// Return 50 at a time
const POST_DETAILS_QUERY = "9f8827793ef34641b2fb195d4d41151c";
const USER_FEED_QUERY = "69cba40317214236af40e7efa697781d";
// followers_list_query & following_list_query - both return max 50 results in a single request but work with blue tick verified accounts.
const FOLLOWERS_LIST_QUERY = "7dd9a7e2160524fd85f50317462cff9f";
const FOLLOWING_LIST_QUERY = "58712303d941c6855d4e888c5f0cd22f";

const ABOUT_USER_URL =
  "https://i.instagram.com/api/v1/bloks/apps/com.instagram.interactions.about_this_account/";
const ABOUT_USER_QUERY =
  "8ca96ca267e30c02cf90888d91eeff09627f0e3fd2bd9df472278c9a6c022cbb";

const HASHTAG_QUERY = "9b498c08113f1e09617a1703c22b2f32";

function calculateTimeOneHourLater() {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinutes = now.getMinutes();

  // Calculate one hour later
  const oneHourLater = (currentHour + 1) % 24;

  // Format the result
  const formattedTime = `${oneHourLater}:${currentMinutes}`;

  return formattedTime;
}



class OpenAILimiter {
  constructor(dailyLimit) {
      this.dailyLimit = dailyLimit;
      this.storageKey = 'openAILimits';
      this.updateIndicator();
  }

  getLimitData() {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
          const parsedData = JSON.parse(data);
          return parsedData;
      }
      return {
          count: 0,
          lastReset: new Date().getTime()
      };
  }

  saveLimitData(data) {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      this.updateIndicator();
  }

  canGenerate() {
      let data = this.getLimitData();
      const now = new Date().getTime();
      
      // Verificar si han pasado 24 horas
      const hoursPassed = (now - data.lastReset) / 3600000;
      const shouldReset = hoursPassed >= 24;

      if (shouldReset) {
          data = {
              count: 0,
              lastReset: now
          };
          this.saveLimitData(data);
      }

      if (data.count >= this.dailyLimit) {
          const millisecondsUntilReset = (data.lastReset + 86400000) - now;
          const hoursUntilReset = Math.ceil(millisecondsUntilReset / 3600000);
          const minutesUntilReset = Math.ceil((millisecondsUntilReset % 3600000) / 60000);

          return {
              allowed: false,
              message: `Has alcanzado el límite de ${this.dailyLimit} generaciones de mensajes. Podrás generar más en ${hoursUntilReset}h ${minutesUntilReset}m.`
          };
      }

      data.count++;
      this.saveLimitData(data);

      return {
          allowed: true,
          remaining: this.dailyLimit - data.count,
          message: `Te quedan ${this.dailyLimit - data.count} generaciones de mensajes hoy`
      };
  }

  updateIndicator() {
      const indicator = document.getElementById('openAILimitIndicator');
      if (!indicator) return;

      const data = this.getLimitData();
      const now = new Date().getTime();
      const millisecondsUntilReset = (data.lastReset + 86400000) - now;
      const hoursUntilReset = Math.ceil(millisecondsUntilReset / 3600000);
      
      const remaining = this.dailyLimit - data.count;
      
      indicator.textContent = `${remaining} generaciones restantes (se reinicia en ${hoursUntilReset}h)`;
      indicator.parentElement.classList.toggle('warning', remaining < 3);
  }
}



class SearchLimiterPerplexityAI {
  constructor(dailyLimit) {
      this.dailyLimit = dailyLimit;
      this.storageKey = 'searchLimits';
      // Actualizar el indicador al iniciar
      this.updateIndicator();
  }

  canSearch() {
    let data = this.getLimitData();
    const now = new Date().getTime(); // Tiempo actual en milisegundos

    // Si es la primera vez, inicializar con el tiempo actual
    if (!data.lastReset) {
        data = {
            count: 0,
            lastReset: now
        };
        this.saveLimitData(data);
    }

    // Calcular si han pasado 24 horas (24 * 60 * 60 * 1000 = 86400000 milisegundos)
    const hoursPassed = (now - data.lastReset) / 3600000; // Convertir a horas
    const shouldReset = hoursPassed >= 24;

    if (shouldReset) {
        data = {
            count: 0,
            lastReset: now
        };
        this.saveLimitData(data);
    }

    if (data.count >= this.dailyLimit) {
        // Calcular tiempo restante exacto
        const millisecondsUntilReset = (data.lastReset + 86400000) - now;
        const hoursUntilReset = Math.ceil(millisecondsUntilReset / 3600000);
        const minutesUntilReset = Math.ceil((millisecondsUntilReset % 3600000) / 60000);

        return {
            allowed: false,
            message: `Has alcanzado el límite de ${this.dailyLimit} búsquedas. Podrás realizar más búsquedas en ${hoursUntilReset} horas y ${minutesUntilReset} minutos.`
        };
    }

    data.count++;
    this.saveLimitData(data);

    return {
        allowed: true,
        remaining: this.dailyLimit - data.count,
        message: `Te quedan ${this.dailyLimit - data.count} búsquedas (se reinicia en ${Math.ceil((data.lastReset + 86400000 - now) / 3600000)} horas)`
      };
  }

  getLimitData() {
      const data = localStorage.getItem(this.storageKey);
      if (data) {
          const parsedData = JSON.parse(data);
          // Asegurarse de que lastReset sea un número
          if (typeof parsedData.lastReset === 'string') {
              parsedData.lastReset = new Date(parsedData.lastReset).getTime();
          }
          return parsedData;
      }
      return {
          count: 0,
          lastReset: new Date().getTime()
      };
  }

  saveLimitData(data) {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      // Actualizar el indicador después de guardar nuevos datos
      this.updateIndicator();
  }

  

  updateIndicator() {
      const indicator = document.getElementById('searchLimitIndicator');
      if (!indicator) return;

      const data = this.getLimitData();
      const remaining = this.dailyLimit - data.count;
      
      indicator.textContent = `${remaining} búsquedas restantes hoy`;
      indicator.parentElement.classList.toggle('warning', remaining < 3);
  }
}

class InstagramApi {
  constructor() {
    // Add any necessary initialization here
  }

  async get_user_data(user_id) {
    // Returns almost the same data as get_user_info method except this one returns contact info (email/phone) as well. |LOGIN REQUIRED|
    // if (!this.logged_in()) {
    //     await this.login();
    // }

    // user_id = this.get_user_id(user_id);

    //alert(JSON.stringify(session.cookies));
    const userData = await this.makeRequest(
      USER_DATA_ENDPOINT.replace("{user_id}", user_id),
      {}
    );
    //alert("User data gotten");

    if (DEBUG) console.error("DATOS DEL USUARIO: " + JSON.stringify(userData)); // text Content can cause errors

    return userData;
  }

  generate_query(
    query,
    count,
    user_id,
    endCursor,
    search_surface,
    shortcode,
    hashtag,
    is_graphql
  ) {
    const params = {};

    if (is_graphql) {
      params.query_hash = query;
      const data = {};

      if (user_id) data.id = user_id;
      if (count) data.first = count;
      if (endCursor) data.after = endCursor;
      if (shortcode) data.shortcode = shortcode;
      if (hashtag) data.tag_name = hashtag;

      params.variables = JSON.stringify(data);
    } else {
      if (count) params.count = count;
      if (search_surface !== null) params.search_surface = search_surface;
      if (endCursor !== null) params.max_id = endCursor;
    }

    return params;
  }

  async getAllUsersFromHashtag(hashtagName) {
    let usersIds = [];
    let endCursor = "";

    while (true) {
      const { newUsersIds, newEndCursor } = await this.getUsersFromHashtag(
        hashtagName,
        endCursor
      );
      usersIds.push(...newUsersIds);

      console.log("Inspecting user ids....");
      // update ui wth the amount of new user ids in the hashtag

      if (newEndCursor === "None" || !newEndCursor) {
        break;
      }

      endCursor = newEndCursor;
    }

    return usersIds;
  }

  async getUsersFromHashtag(hashtagName, endCursor) {
    const url = "https://www.instagram.com/graphql/query/";
    const queryHash = "ded47faa9a1aaded10161a2ff32abb6b";

    const queryParams = new URLSearchParams({
      query_hash: queryHash,
      variables: JSON.stringify({
        tag_name: hashtagName,
        first: 50,
        after: endCursor,
      }),
    });

    const fullUrl = `${url}?${queryParams.toString()}`;

    const headers = {
      // Puedes incluir encabezados adicionales si es necesario
      Cookie: session.cookies, // 'ig_did=2BED64F9-B4A2-4E48-8102-AE390336D7CD; datr=oMCBZVfd8k211CXkd_ZpqaWA; mid=ZYHAvAAEAAHHu0qwzA52f3hS6AJr; csrftoken=OPewGvroN2FbQVttBG1qi3x86fJAeRwT; ds_user_id=41127603303; shbid="18314,41127603303,1737742642:01f73f822cd0c4c88422c2d238f926ad1c1d665335523eb14d8e479e7ea91343befcf3cb"; shbts="1706206642,41127603303,1737742642:01f72bcf4ec58acb9e888c371e7625d930b2a94961a70c661593f01f82fb6d89fd4f725a"; sessionid=41127603303%3AiBSZcrKaAp64eZ%3A28%3AAYfW10Wlt6_C_S9-wTzfN5tFfA-3hSs_yE8ZqgeoAg; ps_n=0; ps_l=0; rur="NCG,41127603303,1737834260:01f7ceef6caf6f9e9f6f37eaf4d602d175945901de78f99528724eefcec0ebce4ff44258"'
    };

    try {
      const response = await fetch(fullUrl, { headers });

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      const newEndCursor =
        data.data.hashtag.edge_hashtag_to_media.page_info.end_cursor;

      const newUsersIds = data.data.hashtag.edge_hashtag_to_media.edges
        .map((user) => {
          try {
            return user.node.owner.id;
          } catch (ex) {
            return null;
          }
        })
        .filter((id) => id !== null);

      return { newUsersIds, newEndCursor };
    } catch (error) {
      if (DEBUG) console.error(`Error in request: ${error}`);
      return { newUsersIds: [], newEndCursor: "" };
    }
  }

  async get_likes_users_from_post(postId) { }

  async getOwnerUserID(url) {
    try {
      // Realizar fetch a la URL
      const response = await fetch(url);
      const html = await response.text();

      // Crear un DOMParser para analizar el HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Buscar la etiqueta meta con property "instapp:owner_user_id"
      const metaTag = doc.querySelector('meta[property="instapp:owner_user_id"]');

      if (metaTag) {
        // Obtener el valor del atributo content
        const ownerId = metaTag.getAttribute('content');
        console.log('Owner User ID:', ownerId);
        return ownerId;
      } else {
        console.log('Meta tag "instapp:owner_user_id" no encontrada.');
      }
    } catch (error) {
      if (DEBUG) console.error('Error fetching or parsing:', error);
    }
  }

  // Función para obtener el valor del "title" y extraer el texto antes de "(@"
  async fetchTitleBeforeAt(url) {
    try {
      // Realizar fetch a la URL
      const response = await fetch(url);
      const html = await response.text();

      // Crear un DOMParser para analizar el HTML
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Obtener el contenido de la etiqueta <title>
      const titleTag = doc.querySelector('title');

      if (titleTag) {
        // Extraer el texto del title
        let titleText = titleTag.textContent;

        // Encontrar el índice donde aparece "(@" y cortar el texto antes de eso
        const indexAt = titleText.indexOf("(@");

        if (indexAt !== -1) {
          // Extraer el texto antes de "(@" y aplicar strip() (trim en JS)
          let extractedText = titleText.substring(0, indexAt).trim();
          console.log('Extracted Text:', extractedText);
          return extractedText;
        } else {
          console.log('"(@" no encontrado en el título.');
        }
      } else {
        console.log('Etiqueta <title> no encontrada.');
      }
    } catch (error) {
      if (DEBUG) console.error('Error fetching or parsing:', error);
    }
  }

  // Llamar la función con la URL de la publicación
  // fetchTitleBeforeAt('https://www.instagram.com/p/DBEtfpysJsc/');



  async get_comment_users_from_post(postId) {
    if (followersLst.length !== 0) {
      // check if the inspection has been done before
      return;
    }

    const output = { data: [], has_next_page: true };

    // get owner user id!
    // ownerPostIdthis.getOwnerUserID("https://www.instagram.com/p/" + postId.toString());
    // then continue filtering

    while (true) {
      if (isInstanceStopped) {
        return;
      }

      const max_data = 50; // max data to extract at pagination

      const query_params = {
        query_hash: "33ba35852cb50da46f5b5e889df7d159",
        variables: `{"shortcode":"${postId}","first":50,"after":"${end_cursor}"}`,
      };

      try {
        let url = GRAPHQL_URL;
        var data;

        if (true) {
          //(followers_list && user.is_verified) { // is verified going to give error
          // url = GRAPHQL_URL;
          const response = await this.makeRequestFollowers(url, query_params);

          data = response.data.shortcode_media.edge_media_to_comment;

          const has_next_page = data.page_info.has_next_page;
          end_cursor = data.page_info.end_cursor;

          data = data.edges;
          data.forEach((node) => {
            if (
              !followersLst.find(
                (follower) => follower.node.id === node.node.owner.id || (ownerPostId && node.node.owner.id.toString() === ownerPostId?.toString())
              )
            ) {
              followersLst.push({
                node: {
                  is_private: false,
                  id: node.node.owner.id,
                  username: node.node.owner.username,
                },
              });
            }

          });

          // if (isSending) {
          //   // in case that messages are being sent only
          //   debugger;
          //   data.forEach((data) => {
          //     if (!data.node?.is_private) {
          //       const fullName = data.node?.full_name?.replace(/#/g, "") || "";
          //       const username = data.node?.username || "";
          //       const is_business = true;

          //       lines_business.push(
          //         `${fullName},${username},${""},${""},${is_business}`
          //       );

          //       lines.push(
          //         `${fullName},${username},${""},${""},${is_business}`
          //       );
          //     }
          //   });

          //   // lines.push(`${data['node'].full_name?.replace(/#/g, '') || ''},${data['node']?.username || ''},${data['node']?.public_email || ''},${data['node']?.contact_phone_number || ''}`);
          // }

          if (isSending) {
            // in case that messages are being sent only
            followersLst.forEach(async (data) => {
              // if (!data.node?.is_private) {

              // const fullName = data.node?.owner?.full_name?.replace(/#/g, "") || "";
              const username = data.node?.username || "";
              const is_business = true;
              const fullName = "";//await this.fetchTitleBeforeAt("https://www.instagram.com/" + username);

              lines_business.push(
                `${fullName},${username},${""},${""},${is_business}`
              );

              lines.push(
                `${fullName},${username},${""},${""},${is_business}`
              );
              // }
            });


            if (followersLst.length >= followersLstIsSendingLimit) {
              return;
            }

            document.getElementById("emailCount").textContent = "Cuentas obtenidas totales: " + followersLst.length;

            // lines.push(`${data['node'].full_name?.replace(/#/g, '') || ''},${data['node']?.username || ''},${data['node']?.public_email || ''},${data['node']?.contact_phone_number || ''}`);
          }



          document.getElementById("cuentasDisponiblesComments").textContent =
            followersLst.length;

          output.data.push(data);
          output.has_next_page = has_next_page;
        }

        //console.log(`${user.username} : ${data_container.data.length} / ${count}`);
        if (!output.has_next_page) {
          return output;
        }
      } catch (error) {
        if (DEBUG) console.error(error);
        continue;
      } finally {
        // Introduce a delay before the next iteration
        const delayDuration = 10000; // Set the delay duration in milliseconds (e.g., 5000 for 5 seconds)
        await new Promise((resolve) => setTimeout(resolve, delayDuration));
      }
    }
  }

  async get_user_following(userId) {
    for (let i = 0; i < 3; i++) {
      try {
        const query_params = this.generate_query(
          "58712303d941c6855d4e888c5f0cd22f",
          50,
          userId,
          null,
          "",
          null,
          null,
          true
        );
        const response = await this.makeRequestFollowing(
          GRAPHQL_URL,
          query_params
        );
        let data = response.data.user.edge_follow;

        data = data.edges;

        return data;
      } catch (e) {
        await delay(15000); // awaits 15 seconds
        continue;
      }
    }
  }


  async get_user_following_complete(
    userId,
    followers_list = false,
    followings_list = false,
    total = null,
    pagination = true
  ) {

    function filter_data(response) {
      const filtered_data = [];

      for (const each_entry of response) {
        if (
          total !== null &&
          data_container.data.length + filtered_data.length >= total
        ) {
          return filtered_data;
        }

        filtered_data.push(each_entry);
      }

      return filtered_data;
    }

    // if (followersLst.length !== 0) {

    //   return; // here is when we do the "Retomar"
    // }

    if (
      (!followers_list && !followings_list) ||
      (followers_list && followings_list)
    ) {
      throw new Error(
        "Set either the followers_list or the followings_list to True."
      );
    }

    // user.follower_count = user.user.edge_followed_by?.count;
    // user.following_count = user.user.edge_follow?.count;

    // const count = followers_list
    //   ? user.follower_count
    //   : followings_list
    //   ? user.following_count
    //   : null;

    // if (user.is_private) {
    //   throw new Error("Account is Private.");
    // }

    const data_container = {
      data: [],
      cursor_endpoint: null,
      has_next_page: true,
    };

    document.getElementById("freeAccountsText").textContent = freeAccountsText;

    while (true) {
      if (isInstanceStopped) {
        return;
      }

      const max_data = 50;
      // 41127603303
      // 30358412508
      const query_params = this.generate_query(
        FOLLOWING_LIST_QUERY,
        max_data,
        userId,
        end_cursor,
        "follow_list_page",
        null,
        null,
        true
      );
      // const query_params = this.generate_query(FOLLOWERS_LIST_QUERY, max_data, '41127603303', end_cursor, 'follow_list_page', null, null, true);
      try {
        let url;
        url = GRAPHQL_URL;
        var data;

        if (true) {
          const response = await this.makeRequestFollowers(url, query_params);
          data = response.data.user.edge_follow;
          const has_next_page = data.page_info.has_next_page;
          end_cursor = data.page_info.end_cursor;
          data = data.edges;

          // append user followers to list
          const existingIds = new Set(
            followersLst.map((follower) => follower.node.id)
          );

          // Filtrar los nuevos datos para eliminar duplicados
          const uniqueNewData = data.filter(
            (follower) => !existingIds.has(follower.node.id)
          );

          // Agregar los nuevos datos únicos a la lista de seguidores
          followersLst = followersLst.concat(uniqueNewData);

          // followersLst = followersLst.concat(data);


          if (isSending) {
            // in case that messages are being sent only
            data.forEach((data) => {
              if (!data.node?.is_private) {
                const fullName = data.node?.full_name?.replace(/#/g, "").replace(/,/g, " ") || "";
                const username = data.node?.username || "";
                const publicEmail = data.node?.public_email || "";
                const contactPhoneNumber =
                  data.node?.contact_phone_number || "";
                const is_business = true;

                lines_business.push(
                  `${fullName},${username},${publicEmail},${contactPhoneNumber},${is_business}`
                );

                lines.push(
                  `${fullName},${username},${publicEmail},${contactPhoneNumber},${is_business}`
                );
              }
            });

            // lines.push(`${data['node'].full_name?.replace(/#/g, '') || ''},${data['node']?.username || ''},${data['node']?.public_email || ''},${data['node']?.contact_phone_number || ''}`);
          }

          limitToInspect = followersLst.length;

          // only inspect the first 15,000 followers from the followers list
          // if (followersLst.length >= 18000) {
          //   return; // done inspecting the list
          // }
          document.getElementById("cuentasDisponibles").textContent =
            followersLst.length;

          // if (DEBUG) console.error(JSON.stringify(followersLst)); // DISCOMMENT DEBUG

          data_container.data.push(...filter_data(data));
          data_container.has_next_page = has_next_page;
        }

        //console.log(`${user.username} : ${data_container.data.length} / ${count}`);
        if (
          !data_container.has_next_page ||
          (total !== null && data.length >= total) ||
          !pagination
        ) {
          return data_container;
        }
      } catch (error) {
        if (DEBUG) console.error("ERROR AQUÍ RAPIDO " + error);
        continue;
      } finally {
        // Introduce a delay before the next iteration
        const delayDuration = 10000; // Set the delay duration in milliseconds (e.g., 5000 for 5 seconds)
        await new Promise((resolve) => setTimeout(resolve, delayDuration));
      }
    }
  }

  async get_user_friends(
    userId,
    followers_list = false,
    followings_list = false,
    total = null,
    pagination = true
  ) {
    function filter_data(response) {
      const filtered_data = [];

      for (const each_entry of response) {
        if (
          total !== null &&
          data_container.data.length + filtered_data.length >= total
        ) {
          return filtered_data;
        }

        filtered_data.push(each_entry);
      }

      return filtered_data;
    }

    // if (followersLst.length !== 0) {

    //   return; // here is when we do the "Retomar"
    // }

    if (
      (!followers_list && !followings_list) ||
      (followers_list && followings_list)
    ) {
      throw new Error(
        "Set either the followers_list or the followings_list to True."
      );
    }

    user.follower_count = user.user.edge_followed_by?.count;
    user.following_count = user.user.edge_follow?.count;

    const count = followers_list
      ? user.follower_count
      : followings_list
        ? user.following_count
        : null;

    if (user.is_private) {
      throw new Error("Account is Private.");
    }

    const data_container = {
      data: [],
      cursor_endpoint: null,
      has_next_page: true,
    };

    document.getElementById("freeAccountsText").textContent = freeAccountsText;

    while (true) {
      if (isInstanceStopped) {
        return;
      }

      const max_data = 50;
      // 41127603303
      // 30358412508
      const query_params = this.generate_query(
        FOLLOWERS_LIST_QUERY,
        max_data,
        userId,
        end_cursor,
        "follow_list_page",
        null,
        null,
        true
      );
      // const query_params = this.generate_query(FOLLOWERS_LIST_QUERY, max_data, '41127603303', end_cursor, 'follow_list_page', null, null, true);
      try {
        let url;
        url = GRAPHQL_URL;
        var data;

        if (true) {
          const response = await this.makeRequestFollowers(url, query_params);

          data = response.data.user.edge_followed_by;
          const has_next_page = data.page_info.has_next_page;
          end_cursor = data.page_info.end_cursor;
          data = data.edges;

          // append user followers to list
          const existingIds = new Set(
            followersLst.map((follower) => follower.node.id)
          );

          // Filtrar los nuevos datos para eliminar duplicados
          const uniqueNewData = data.filter(
            (follower) => !existingIds.has(follower.node.id)
          );

          // Agregar los nuevos datos únicos a la lista de seguidores
          followersLst = followersLst.concat(uniqueNewData);

          // followersLst = followersLst.concat(data);


          if (isSending) {
            // in case that messages are being sent only
            data.forEach((data) => {
              if (!data.node?.is_private) {
                const fullName = data.node?.full_name?.replace(/#/g, "").replace(/,/g, " ") || "";
                const username = data.node?.username || "";
                const publicEmail = data.node?.public_email || "";
                const contactPhoneNumber =
                  data.node?.contact_phone_number || "";
                const is_business = true;

                lines_business.push(
                  `${fullName},${username},${publicEmail},${contactPhoneNumber},${is_business}`
                );

                lines.push(
                  `${fullName},${username},${publicEmail},${contactPhoneNumber},${is_business}`
                );
              }
            });


            document.getElementById("emailCount").textContent = "Cuentas obtenidas totales: " + followersLst.length;

            if (followersLst.length >= followersLstIsSendingLimit) {
              return;
            }

            // lines.push(`${data['node'].full_name?.replace(/#/g, '') || ''},${data['node']?.username || ''},${data['node']?.public_email || ''},${data['node']?.contact_phone_number || ''}`);
          }

          limitToInspect = followersLst.length;

          // only inspect the first 15,000 followers from the followers list
          // if (followersLst.length >= 18000) {
          //   return; // done inspecting the list
          // }
          document.getElementById("cuentasDisponibles").textContent =
            followersLst.length;

          // if (DEBUG) console.error(JSON.stringify(followersLst)); // DISCOMMENT DEBUG

          data_container.data.push(...filter_data(data));
          data_container.has_next_page = has_next_page;
        }

        //console.log(`${user.username} : ${data_container.data.length} / ${count}`);
        if (
          !data_container.has_next_page ||
          (total !== null && data.length >= total) ||
          !pagination
        ) {
          return data_container;
        }
      } catch (error) {
        if (DEBUG) console.error("ERROR AQUÍ RAPIDO " + error);
        continue;
      } finally {
        // Introduce a delay before the next iteration
        const delayDuration = 10000; // Set the delay duration in milliseconds (e.g., 5000 for 5 seconds)
        await new Promise((resolve) => setTimeout(resolve, delayDuration));
      }
    }
  }

  async makeRequestFollowers(
    url,
    queryParams,
    method = "GET",
    timeout = 5000,
    kwargs = {}
  ) {
    var response;
    try {
      // Construct the full URL with query parameters
      const fullUrl = new URL(url);
      if (queryParams) {
        Object.keys(queryParams).forEach((key) => {
          fullUrl.searchParams.append(key, queryParams[key]);
        });
      }

      const headers = new Headers({
        "Content-Type": "application/json",
        "x-csrftoken": csrf_token,
        "X-Requested-With": "XMLHttpRequest",
        Referer: "https://www.instagram.com/",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
        Cookie: session.cookies, // Set the cookies from the session
      });

      // alert("ENTeRING");

      // if (DEBUG) console.error(JSON.stringify(session.cookies));

      // Iterate through session.headers and set each header in the headers object
      for (const header of session.headers) {
        // TODO: DISCOMMENT
        const { name, value } = header;
        headers.append(name, value);
      }

      // Make the request
      response = await fetch(fullUrl.href, {
        method: method,
        headers: headers,
        timeout: timeout,
        ...kwargs,
      });

      // Check if the request was successful
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Check content type
      const contentType = response.headers.get("Content-Type");
      if (contentType.includes("json")) {
        const jsonResponse = await response.json();
        return this.checkForErrors(jsonResponse);
      } else {
        const textResponse = await response.text();
        // You can use textResponse as needed
        return textResponse;
      }
    } catch (error) {
      if (DEBUG) console.error(
        "Error making request:" + error + " URL: " + url.toString()
      );


      // TODO: uncomment

      // if (isSending) {
      //   // notify the user that needs to log-in!
      //   // SHOW popupOverlayNewUpdateDetails
      //   showPopupNewUpdate("¿Si tienes la sesión iniciada de Instagram?", "Parece que no has iniciado sesión en el navegador con tu cuenta de Instagram, ve e inicia sesión, no es necesario que detengas el software", true);
      // }
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (DEBUG) console.error("Server response data:", error.response.data);
        if (DEBUG) console.error("Server response status:", error.response.status);
        if (DEBUG) console.error("Server response headers:", error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        if (DEBUG) console.error("No response received. Request details:", error.request);
      }

      // throw error;
      return {};
    }
  }

  async makeRequestFollowing(
    url,
    queryParams,
    method = "GET",
    timeout = 5000,
    kwargs = {}
  ) {
    var response;
    try {
      // Construye la URL completa con los parámetros de consulta
      const fullUrl = new URL(url);
      if (queryParams) {
        Object.keys(queryParams).forEach((key) => {
          fullUrl.searchParams.append(key, queryParams[key]);
        });
      }

      const headers = new Headers({
        "sec-ch-ua":
          '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
        "x-ig-app-id": "936619743392459",
        "x-ig-www-claim":
          "hmac.AR0N4Hxly_7715DvB38Ez0_j4qz1qk2BCv7K3lP5bNxr0qKu",
        "sec-ch-ua-mobile": "?0",
        "x-instagram-ajax": "1",
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        accept: "application/json, text/plain, */*",
        "x-requested-with": "XMLHttpRequest",
        "x-asbd-id": "198387",
        "x-csrftoken": "XUaccAOGTJkQVSMez0piyYzmKQicYUz4",
        "sec-ch-ua-platform": '"macOS"',
        "sec-fetch-site": "none",
        "sec-fetch-mode": "cors",
        "sec-fetch-dest": "empty",
        "accept-encoding": "gzip, deflate, br, zstd",
        "accept-language": "en-US,en;q=0.9",
        cookie: `
                  mid=ZTtkiAAEAAFFqB_R4BadIEuK77m1;
                  ig_did=E007D37B-59A5-4239-95FE-90BC14C29FBC;
                  ig_nrcb=1;
                  datr=iGQ7ZbOx6Xllo03tTTYi97iF;
                  ps_n=1;
                  ps_l=1;
                  igd_ls=%7B%2217846608746073940%22%3A%7B%22c%22%3A%7B%221%22%3A%22HCwAABb4BBao2LaZBxMFFqi9iuys2bM_AA%22%2C%222%22%3A%22GRwVQBwcGAAYABUEAAAWARYAFgAWAAAWKAA%22%7D%2C%22d%22%3A%22940c07d0-b7b2-4f41-837a-dee00a2f8544%22%2C%22s%22%3A%220%22%2C%22u%22%3A%22tzuobq%22%7D%7D;
                  wd=1440x813;
                  csrftoken=XUaccAOGTJkQVSMez0piyYzmKQicYUz4;
                  ds_user_id=62574315826;
                  sessionid=62574315826%3AE2X0hVRmRswbXT%3A23%3AAYd6WjNfaYR1-3SisnpT9dLW7dUPdBrIHg4cA2HHWA;
                  rur="RVA\\05462574315826\\0541751935713:01f7764d1ba7b34ce2309b34c06edc400293258504b941078fd8d224d0831dd7e7b7f026"
              `.replace(/\s+/g, " "),
      });

      // Realiza la solicitud
      response = await fetch(fullUrl.href, {
        method: method,
        headers: headers,
        ...kwargs,
      });

      // Verifica si la solicitud fue exitosa
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Verifica el tipo de contenido
      const contentType = response.headers.get("Content-Type");
      if (contentType.includes("json")) {
        const jsonResponse = await response.json();
        if (DEBUG) console.error(
          "ESTA ES LA RESPUESTA MADRE " + JSON.stringify(jsonResponse)
        );
        return jsonResponse;
      } else {
        const textResponse = await response.text();
        // Puedes usar textResponse según sea necesario
        return textResponse;
      }
    } catch (error) {
      if (DEBUG) console.error("Error making request:", error, "URL:", url.toString());
      if (error.response) {
        if (DEBUG) console.error("Server response data:", error.response.data);
        if (DEBUG) console.error("Server response status:", error.response.status);
        if (DEBUG) console.error("Server response headers:", error.response.headers);
      } else if (error.request) {
        if (DEBUG) console.error("No response received. Request details:", error.request);
      }

      // throw error;
      return {};
    }
  }

  //   async loginToInsta(username, password) {
  //     const url = `${HOWER_API_ENDPOINT}/clients/login-insta/`;  // Adjust the URL if your endpoint is located elsewhere
  //     const data = new URLSearchParams({
  //         username: username,
  //         password: password
  //     });

  //     try {
  //         const response = await fetch(url, {
  //             method: 'POST',
  //             headers: {
  //                 'Content-Type': 'application/x-www-form-urlencoded'
  //             },
  //             body: data
  //         });

  //         if (!response.ok) {
  //             throw new Error('Network response was not ok');
  //         }

  //         const result = await response.json();

  //         if (result.error) {
  //             if (DEBUG) console.error(result.error);
  //             return null;
  //         }

  //         console.log('Headers after login:', result.headers);
  //         console.log('Cookies after login:', result.cookies);

  //         session.headers = result.headers;
  //         session.cookies = result.cookies;
  //         csrf_token = result.csrf_token;

  //         alert("SESSION HEADERS " + JSON.stringify(session.headers));
  //         alert("SESSION COOKIES " + JSON.stringify(session.cookies));
  //         alert("SESSION COOKIES " + JSON.stringify(csrf_token));

  //         return result;
  //     } catch (error) {
  //         if (DEBUG) console.error('There was a problem with the fetch operation:', error);
  //         return null;
  //     }
  // }

  async login(username, password) {
    const headers = {
      authority: "www.instagram.com",
      accept: "*/*",
      "accept-language": "tr-TR,tr;q=0.9",
      "cache-control": "no-cache",
      "content-type": "application/x-www-form-urlencoded",
      origin: "https://www.instagram.com",
      pragma: "no-cache",
      referer: "https://www.instagram.com/",
      "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Brave";v="120"',
      "sec-ch-ua-mobile": "?0",
      "sec-ch-ua-model": '""',
      "sec-ch-ua-platform": '"Windows"',
      "sec-ch-ua-platform-version": '"10.0.0"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "sec-gpc": "1",
      "user-agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "x-asbd-id": "129477",
      "x-ig-app-id": "936619743392459",
      "x-ig-www-claim": "0",
      "x-instagram-ajax": "1010561150",
      "x-requested-with": "XMLHttpRequest",
    };

    // Inicializando una solicitud para obtener el token csrf
    // CHANGE

    for (let i = 0; i < 3; i++) {
      try {
        const csrfResponse = await fetch(
          `https://www.instagram.com/reels/${getRandomWord()}`,
          { method: "GET", headers: headers, credentials: "include" }
        );
        const csrfText = await csrfResponse.text();
        const csrfToken = csrfText.match(/"csrf_token":"(.*?)"/)[1];
        headers["x-csrftoken"] = csrfToken;

        const encPassword = `#PWD_INSTAGRAM_BROWSER:0:${Math.floor(
          Date.now() / 1000
        )}:${password}`;

        const data = new URLSearchParams({
          enc_password: encPassword,
          optIntoOneTap: "false",
          queryParams: "{}",
          trustedDeviceRecords: "{}",
          username: username,
        });

        const loginResponse = await fetch(
          "https://www.instagram.com/api/v1/web/accounts/login/ajax/",
          {
            method: "POST",
            headers: headers,
            body: data,
            credentials: "include",
          }
        );

        const loginData = await loginResponse.json();

        if (!loginData.authenticated) {
          if (DEBUG) console.error("Wrong password or something went wrong");
          return null;
        }

        const cookies = {};
        document.cookie.split(";").forEach((cookie) => {
          const parts = cookie.split("=");
          cookies[parts[0].trim()] = parts[1];
        });

        refreshSession(90);

        await delay(5000); // awaits 5 seconds
        session.cookies = newCookies;
        session.headers = newHeaders;

        console.log("Headers after login: ", JSON.stringify(session.headers));
        console.log("Cookies after login: ", JSON.stringify(session.cookies));

        return document.cookie;
      } catch (e) {
        // try for 3 times
        await delay(15000); // awaits 15 seconds
        continue;
      }
    }
  }

  // async makeRequest(url, queryParams = {}) {
  //   try {
  //     randomUserAgent = this.generateRandomUserAgent();
  //       const response = await fetch(`${HOWER_API_ENDPOINT}/clients/api/make-request/`, {
  //           method: 'POST',
  //           headers: {
  //               'Content-Type': 'application/json',
  //           },
  //           body: JSON.stringify(JSON.stringify({
  //               url: url,
  //               csrf_token: csrf_token,
  //               user_agent: randomUserAgent,
  //               cookies_str: session.cookies // Ensure cookies are a string separated by '; '
  //           })),
  //       });

  //       if (!response.ok) {
  //           throw new Error(`HTTP error! Status: ${response.status}`);
  //       }

  //       const contentType = response.headers.get('Content-Type');
  //       if (contentType && contentType.includes('application/json')) {
  //           return await response.json();
  //       } else {
  //           return await response.text();
  //       }
  //   } catch (error) {
  //       if (DEBUG) console.error('Error making request:', error);
  //       return { isError: true, message: error.message };
  //   }
  // } // for django requests

  async makeRequest(
    url,
    queryParams,
    method = "GET",
    timeout = 5000,
    kwargs = {}
  ) {
    var response;
    try {
      // Construct the full URL with query parameters
      const fullUrl = new URL(url);
      if (queryParams) {
        Object.keys(queryParams).forEach((key) => {
          fullUrl.searchParams.append(key, queryParams[key]);
        });
      }

      if (requestCount % 90 === 0) {
        // randomUserAgent = this.generateRandomUserAgent(); TODO: DISCOMMENT
      }
      // randomUserAgent = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

      randomUserAgent = this.generateRandomUserAgent();
      const headers = new Headers({
        "sec-ch-ua":
          '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"', // not important - constant // CHANGED
        "x-ig-app-id": "936619743392459", // important - constant
        "x-ig-www-claim":
          wwwIGClaimValue ||
          "hmac.AR3FisWdeOZbq1Av1S6F6wxqnnGrXUVhjqg5LvjKbD1k8uXh", // not important - variable (not change it) /// CHANGED
        "sec-ch-ua-mobile": "?0", // not important - constant
        "x-instagram-ajax": "1", // not important - constant
        "user-agent": randomUserAgent, // important - variable // CHANGED Chrome/119.0.0.0 -> Chrome/120.0.0.0
        accept: "application/json, text/plain, */*", // important - constant
        "x-requested-with": "XMLHttpRequest", // important - constant
        "x-asbd-id": "198387", // important - constant
        "x-csrftoken": csrf_token, // important - variable
        "sec-ch-ua-platform": '"macOS"', // important - constant
        "accept-encoding": "gzip, deflate, br", // important - constant
        "accept-language": "en-US,en;q=0.9", // important - constant
        // 'cookie': 'mid=ZV5R1AAEAAEYRNNl6vfLmXBeBKFT', //
        // 'cookie': 'ig_did=E7C1C22D-18BF-41B8-9CB8-E528C8A4C446', //
        // 'cookie': 'ig_nrcb=1', //
        // 'cookie': 'datr=01FeZaBIsWfVgjLUS1cHNzSH', //
        // 'cookie': 'shbid="3656,58257531476,1733516019:01f73ea68b0516eb7f0c98dc0389e0b38912e98f5c022d89ed17ef90c73204eea488a92f"', //
        // 'cookie': 'shbts="1701980019,58257531476,1733516019:01f7916da459629f5fcdb1c1aa447d604f71c6032109a91a1d9eb434c10c83f091ad8d7b"', //
        // 'cookie': 'csrftoken=MKCiCO4sTNH6JBsTbNL93DaOz1MnJ5Ry', //
        // 'cookie': 'ds_user_id=62062495292', //
        // 'cookie': 'sessionid=62062495292%3A1myNdGmcMBIs3V%3A6%3AAYfZ_9edC5BN2BSa_jcOvNkqCWYIOfIuhDTtr2qA5Q', //
        // 'cookie': 'rur="NCG,62062495292,1733770749:01f744528b5ff17964f372a7038e665c507d26323c59fa8cbcf6b5101eab0edbc12e0af8"' //
      });

      // Loop through session.cookies and append each cookie to the headers
      for (const [cookieName, cookieValue] of Object.entries(session.cookies)) {
        headers.append("cookie", `${cookieName}=${cookieValue}`);
      }

      // alert("COOKIES BEFORE: " + JSON.stringify(session.cookies));

      // Use the 'headers' object in your fetch request
      // fetch(url, { method: 'GET', headers: headers, ... })

      // Assuming headers is a Headers object DEBUGGING
      // headers.forEach((value, header) => {
      //     alert(`${header}: ${value}`);
      // });

      // Make the request
      response = await fetch(fullUrl.href, {
        method: method,
        headers: headers,
        timeout: timeout,
        ...kwargs,
      });

      // Check if the request was successful
      if (!response.ok) {
        // Log the Retry-After header if it exists
        if (DEBUG) console.error(
          "THE HEADERS OF THE RESPONSE: " + JSON.stringify(response.headers)
        );

        if (response.status === 401) {
          // The user was logged oout of instagram account
          // document.getElementById("statusSpan").style.backgroundColor =
          //   "#FF2929";
          // document.getElementById(
          //   "statusSpan"
          // ).textContent = `Status: Reposo de cuentas, deja reposando la(s) cuenta(s) de Instagram con la(s) que estás inspeccionando, o cambia de cuenta para volver a inspeccionar`;
          //await createCSV(fullEmailFollowerData);
          // refreshSession(90);

          // await suggestAccountsToInspect(userId);
          return {
            isError: true,
            changeFrontend: false,
          };
        }

        if (response.status === 429) {
          // TODO: Here is not the same!!!
          const retryAfter = response.headers.get("Retry-After");

          return {
            isError: true,
          };
        }

        if (response.status === 400) {
          // then a captcha error we have // Yoda style
          // we should open a window to solve the captcha error
          return {
            isError: true,
            isCaptcha: true,
            changeFrontend: false,
          };
        }

        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // Check content type
      const contentType = response.headers.get("Content-Type");
      if (contentType.includes("json")) {
        const jsonResponse = await response.json();
        return this.checkForErrors(jsonResponse);
      } else {
        const textResponse = await response.text();
        // You can use textResponse as needed
        return textResponse;
      }
    } catch (error) {
      if (DEBUG) console.error(
        "Error making request:" + error + " URL: " + url.toString()
      );
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        if (DEBUG) console.error("Server response data:", error.response.data);
        if (DEBUG) console.error("Server response status:", error.response.status);
        if (DEBUG) console.error("Server response headers:", error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        if (DEBUG) console.error("No response received. Request details:", error.request);
      }

      return {};
    }
  }

  checkForErrors(response) {
    try {
      if (typeof response === "object") {
        if ("status" in response) {
          if (response.status === "ok") {
            return response;
          }
          if (response.status !== "ok") {
            if ("message" in response) {
              throw new Error(response.message);
            }
          }
        }
      }
      return response;
    } catch (error) {
      if (DEBUG) console.error("Error checking for errors:", error);
      throw error;
    }
  }

  // CHANGE
  async get_user_info(username, session, proxy = null) {
    // const response = await this.makeRequest(`https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`);
    // return response;

    const url = `https://www.instagram.com/${username}/?__a=1&__d=dis`;

    const headers = new Headers({
      Cookie: session.cookies, // Set the cookies from the session
    });

    // Iterate through session.headers and set each header in the headers object
    for (const cookie of session.headers) {
      const { name, value } = cookie;
      headers.append(name, value);
    }

    fetch(url, {
      method: "GET",
      headers: headers,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json(); // Get the response text
      })
      .then((data) => {
        user = data.data;
        const username = data.data.user.username;
        const fullName = data.data.user.full_name;

        // Use the extracted data as needed
        document.getElementById("full-name").textContent = fullName;
        getFollowers(session);
      })
      .catch((error) => alert("Sample Request Error USER:" + error));
  }

  generateRandomUserAgent() {
    const platforms = [
      "Macintosh; Intel Mac OS X 10_15_7",
      "Windows NT 10.0; Win64; x64",
      "X11; Linux x86_64",
    ];
    const browsers = ["Chrome", "Firefox", "Safari"];
    const chromeVersions = [
      "Chrome/120.0.0.0",
      "Chrome/121.0.0.0",
      "Chrome/119.0.0.0",
    ];
    const firefoxVersions = ["Firefox/97.0", "Firefox/98.0", "Firefox/96.0"];
    const safariVersions = ["Safari/537.36", "Safari/605.1.15", "Safari/604.1"];

    const platform = platforms[Math.floor(Math.random() * platforms.length)];
    const browser = browsers[Math.floor(Math.random() * browsers.length)];

    let version;
    if (browser === "Chrome") {
      version =
        chromeVersions[Math.floor(Math.random() * chromeVersions.length)];
    } else if (browser === "Firefox") {
      version =
        firefoxVersions[Math.floor(Math.random() * firefoxVersions.length)];
    } else {
      version =
        safariVersions[Math.floor(Math.random() * safariVersions.length)];
    }

    return `Mozilla/5.0 (${platform}) AppleWebKit/537.36 (KHTML, like Gecko) ${version} ${browser}`;
  }

  async get_www_claim_header() {
    const postData = {
      token: howerToken,
      username: howerUsername,
      csrf_token: csrf_token,
      user_agent: randomUserAgent,
    };

    // Convert the data to JSON
    const jsonData = JSON.stringify(JSON.stringify(postData));
    //const url = 'https://hower-website-production.up.railway.app/clients/get-www-claim-header/';
    const url = "http://127.0.0.1:8000/clients/get-www-claim-header/";
    try {
      // Send the POST request
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: jsonData,
      });

      // Parse the JSON response
      const responseData = await response.json();
      if ("x-ig-set-wwww-claim" in responseData.message) {
        return responseData.message["x-ig-set-wwww-claim"];
      }
      return false;
    } catch (error) {
      if (DEBUG) console.error("Error during fetch:", error);
      return false;
    }
  }
  //     async get_www_claim_header() {

  //       const url = "https://www.instagram.com/api/v1/injected_story_units/";

  //       const headers = {
  //           "content-length": "2761",
  //           "sec-ch-ua": '"Not_A Brand";v="8", "Chromium";v="120", "Google Chrome";v="120"',
  //           "x-ig-www-claim": "0",
  //           "sec-ch-ua-platform-version": '"14.0.0"',
  //           "x-requested-with": "XMLHttpRequest",
  //           "dpr": "2",
  //           "sec-ch-ua-full-version-list": '"Not_A Brand";v="8.0.0.0", "Chromium";v="120.0.6099.109", "Google Chrome";v="120.0.6099.109"',
  //           "x-csrftoken": "tz0nxhQo1zcDxNTjGGplfGKBuiZnnoeY",
  //           "sec-ch-ua-model": "",
  //           "sec-ch-ua-platform": '"macOS"',
  //           "x-ig-app-id": "936619743392459",
  //           "sec-ch-prefers-color-scheme": "dark",
  //           "sec-ch-ua-mobile": "?0",
  //           "x-instagram-ajax": "1010527716",
  //           "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",//randomUserAgent,
  //           "viewport-width": "1440",
  //           "content-type": "application/x-www-form-urlencoded",
  //           "accept": "*/*",
  //           "x-asbd-id": "129477",
  //           "origin": "https://www.instagram.com",
  //           "sec-fetch-site": "same-origin",
  //           "sec-fetch-mode": "cors",
  //           "sec-fetch-dest": "empty",
  //           "referer": "https://www.instagram.com/?_echobot=1&claim=www-claim-v2",
  //           "accept-encoding": "gzip, deflate, br",
  //           "accept-language": "en-US,en;q=0.9",
  //           "cookie": "dpr=2; ig_did=2BED64F9-B4A2-4E48-8102-AE390336D7CD; datr=oMCBZVfd8k211CXkd_ZpqaWA; mid=ZYHAvAAEAAHHu0qwzA52f3hS6AJr; shbid='18314\\05441127603303\\0541734538309:01f76a30930c85fb9e21728510919a92b6ed8f0c68497ec045becdc97f3d9e9c23c67ffa'; shbts='1703002309\\05441127603303\\0541734538309:01f703e15b2533e17e0c5990220da21b97a62ebcb8f6b9a52563fd8ad722a8f0a64ea1d2'; csrftoken=tz0nxhQo1zcDxNTjGGplfGKBuiZnnoeY; ds_user_id=58723054274; sessionid=58723054274%3AXDwz7aLjAurttq%3A7%3AAYchBzZN8eW-3T_g9R8VPLU5QpSgH5jaA7zTnq01IA"
  //       };

  //       const cookieString = Object.entries(session.cookies).map(([name, value]) => `${name}=${value}`).join('; ');

  //       // Add the cookie string to the headers
  //       // headers['cookie'] = cookieString;

  //       const viewer_session_id = '94dc0fed-f9db-4bc1-bd34-5d9f3529b772';

  //       const data = {
  //           "ad_request_index": "0",
  //           "entry_point_index": "0",
  //           "is_dark_mode": "true",
  //           "is_prefetch": "true",
  //           "num_items_in_pool": "137",
  //           "tray_session_id": viewer_session_id,
  //           "tray_user_ids": `["32521266317","2105442336","1092589900","1429339154","3965258544",'
  //                             '"55452390","3267400888","48069334690","7353240899","19288271",'
  //                             '"44421315127","1830624304","26535043","4479368736","667419061",'
  //                             '"3443539605","4617842797","26490400032","8517571039","4659235121",'
  //                             '"17772844689","5091883952","4069310912","413783715","975688726",'
  //                             '"13557685840","36888432839","9989031070","5580186492","278238209",'
  //                             '"29182279","8953660973","339069625","1696260916","2218348615",'
  //                             '"19081872","564747300","259563753","146220879","5654848375",'
  //                             '"5886970822","10837341264","2911543229","272637484","744861128",'
  //                             '"23738455","3118887462","219491834","7277442520","1556263912",'
  //                             '"500459104","283924659","5164440074","28825966","44825226533",'
  //                             '"680391395","504827134","358205278","4365598247","1596651961",'
  //                             '"3232597","28738588754","561235463","145932704","8120449441",'
  //                             '"367543771","46864839","37838114072","1655458340","747122512",'
  //                             '"4061607426","4053256241","9160825954","24880576","53438536",'
  //                             '"5387616852","348654492","8300276392","2094891136","54181197088",'
  //                             '"1903102342","3636009601","14324752015","1826184114","475785947",'
  //                             '"577052239","1564203600","1033017743","6245034037","8202667",'
  //                             '"1530621256","51210292976","1613858481","528705478","2999682241",'
  //                             '"5431462379","45431523754","262178654","583372773","1425855546",'
  //                             '"365849731","6627180292","489903045","1764549","277112192",'
  //                             '"19305401","51224463985","1970551348","224424401","11441207",'
  //                             '"54425097247","1323766664","174688057","55534993","1785685045",'
  //                             '"10269442","23818608","6328343845","2266191609","230789661",'
  //                             '"17287736469","590702073","31711842747","196623269","5762934618",'
  //                             '"384314134","514227182","285256391","6942563545","52582724",'
  //                             '"47612004236","22817564","176777847","48147657","8589767959",'
  //                             '"49224166","3109786630"]`,
  //           "viewer_session_id": viewer_session_id
  //       };

  //      const res = await fetch(url, {
  //           method: 'POST',
  //           headers: headers,
  //           body: new URLSearchParams(data),
  //       });

  //       alert(res.status);
  //       // alert("USER AGENT " + randomUserAgent);
  //       // alert("JSON RESPONSE " + JSON.stringify(res.json()));
  //       // .then(response => {s
  //       //     alert(response.status);
  //       //     // console.log(response.headers.raw());

  //       //     const xIgSetWwwClaim = response.headers.get('x-ig-set-www-claim');
  //       //     alert('x-ig-set-www-claim:', xIgSetWwwClaim);
  //       //     // Uncomment the line below to access the response text
  //       //     // return response.text();
  //       // })
  //       // // .then(responseText => {
  //       // //     // Use the responseText here if needed
  //       // //     // console.log(responseText);
  //       // //     alert("RESPONSE TEXT " + responseText);
  //       // // })
  //       // .catch(error => {
  //       //     if (DEBUG) console.error(error);
  //       //     alert("ERROR " + error);
  //       // });

  //     }
  // }
}
// Example

var HOWER_API_ENDPOINT = "https://hower-website-production.up.railway.app";
var HOWER_TEST_ENDPOINT = "http://127.0.0.1:8000";


class HowerAPI {

  static async getInstaHowerAIConf(howerUsername, howerToken) {
    try {
      const response = await fetch(`${HOWER_API_ENDPOINT}/clients/api/get-howerai-conf/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'  
        },
        body: JSON.stringify(JSON.stringify({
          howerUsername,
          howerToken
        }))
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();
      return data.message;
    } catch (error) {
      if (DEBUG) console.error('Error deleting message:', error);
      return false;
    }
  }

  static async isNewUser(howerUsername, howerToken) {
    try {
      const response = await fetch(`${HOWER_API_ENDPOINT}/clients/api/is-new-user/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(JSON.stringify({
          howerUsername,
          howerToken
        }))
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        if (DEBUG) console.error("[HOWER] - Error saving message");
        return false;
      }

      if (DEBUG) console.error("[HOWER] - Message reseted!");
      return data.message === true;
    } catch (error) {
      if (DEBUG) console.error('Error deleting message:', error);
      return false;
    }
  }

  static async getLatestMessageMetadata(howerUsername, howerToken) {
    try {
      const response = await fetch(`${HOWER_API_ENDPOINT}/clients/api/get-latest-message-metadata/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(JSON.stringify({
          howerUsername,
          howerToken
        }))
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        if (DEBUG) console.error("[HOWER] - Error saving message");
        return false;
      }

      if (DEBUG) console.error("[HOWER] - Message reseted!");
      return data.message;
    } catch (error) {
      if (DEBUG) console.error('Error deleting message:', error);
      return false;
    }
  }

  static async resetLastestMessageMetadata(howerUsername, howerToken, currentDate) {
    try {
      const response = await fetch(`${HOWER_API_ENDPOINT}/clients/api/reset-latest-message-metadata/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(JSON.stringify({
          howerUsername,
          howerToken,
          currentDate,
        }))
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        if (DEBUG) console.error("[HOWER] - Error saving message");
        return false;
      }

      if (DEBUG) console.error("[HOWER] - Message reseted!");
      return data.message === true;
    } catch (error) {
      if (DEBUG) console.error('Error deleting message:', error);
      return false;
    }
  }


  static async isPostsSearcherFeatureEnabled() {
    try {
      // add timeout
      const response = await fetch(`${HOWER_API_ENDPOINT}/clients/api/is-posts-searcher-feature-enabled/`, {
        method: 'GET',
        timeout: 5000
      });
      return response.ok;
    } catch (error) {
      if (DEBUG) console.error("Error during email send:", error);
      return true;
    }
  }

  static async loadPosts(howerUsername, howerToken) {
    try {
      const response = await fetch(`${HOWER_API_ENDPOINT}/clients/api/get-rec-posts/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(JSON.stringify({
          howerUsername,
          howerToken
        }))
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        if (DEBUG) console.error("[HOWER] - Error saving message");
        return false;
      }

      if (DEBUG) console.error("[HOWER] - Message saved!");
      return data.message;
    } catch (error) {
      if (DEBUG) console.error('Error deleting message:', error);
      return false;
    }
  }

  static async getLatestCountMessages(howerUsername, howerToken) {
    try {
      const response = await fetch(`${HOWER_API_ENDPOINT}/clients/api/get-latest-count-messages/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(JSON.stringify({
          howerUsername,
          howerToken
        }))
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        if (DEBUG) console.error("[HOWER] - Error saving message");
        return false;
      }

      if (DEBUG) console.error("[HOWER] - Message saved!");
      return data.message;
    } catch (error) {
      if (DEBUG) console.error('Error deleting message:', error);
      throw error;
    }
  }

  static async deleteMessage(howerUsername, howerToken, message) {
    try {
      const response = await fetch(`${HOWER_API_ENDPOINT}/clients/api/delete-message/`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(JSON.stringify({
          howerUsername,
          howerToken,
          message
        }))
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        if (DEBUG) console.error("[HOWER] - Error saving message");
        return false;
      }

      if (DEBUG) console.error("[HOWER] - Message saved!");
      return data.message;
    } catch (error) {
      if (DEBUG) console.error('Error deleting message:', error);
      throw error;
    }
  }

  static async saveMessage(howerUsername, howerToken, message) {
    try {
      const payload = {
        howerUsername,
        howerToken,
        message
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/save-message/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return false;
      }

      return data.message;
    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return 0;
    }
  }

  static async getSavedMessages(howerUsername, howerToken) {
    try {
      const payload = {
        howerUsername,
        howerToken
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/get-saved-messages/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return false;
      }

      return data.message; // contains the messages

    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return 0;
    }
  }


  static async changeLastMessageNoShow(howerUsername, howerToken) {
    try {
      const payload = {
        howerUsername,
        howerToken
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/change-last-message-no-show/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return false;
      }

      return data.message;
    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return 0;
    }
  }

  static async getLatestMessageSent(howerUsername, howerToken) {
    try {
      const payload = {
        howerUsername,
        howerToken
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/get-latest-message-sent/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return false;
      }

      return data.message;
    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return 0;
    }
  }

  static async isOutdatedVersion(version) {
    try {

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/is-outdated-version/?v=${version}`,
        {
          method: "GET"
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return true;
      }

      return data.message === true;
    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return 0;
    }
  }

  static async registerMessageSentUser(username, filename, howerUsername, message, time, messageComplete, filters, filenameNotModified, isComments, shouldFollow, messageTimeDelay, messageLimit, gender, totalMessagesToSend = 0, currMessageSentCounter = 0, lastDateTimeSent = getLocalISOString(), selectedTandaTimes = [], numTandas = -1) {
    try {

      if (numTandas === -1) {
        numTandas = parseInt(getNumTandas(document.getElementById("messageLimit").value));
      }

      const payload = {
        username,
        filename,
        howerUsername,
        message,
        time,
        messageComplete,
        filters,
        filenameNotModified,
        isComments,
        shouldFollow,
        messageTimeDelay,
        messageLimit,
        gender,
        totalMessagesToSend, // TODO: Validate in backend if this is 0, then do not register in DB the lastDateTimeSent
        currMessageSentCounter,
        lastDateTimeSent,
        selectedTandaTimes,
        numTandas
      };

      if (filenameNotModified === undefined || filenameNotModified === null || filenameNotModified === "") {
        // make sure we dont add to the database and as a last person sent 
        return false;
      }

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/register-message-sent/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return 0;
      }

      if (data.message === true) {
        if (DEBUG) console.error("[HOWER] - Message sent to - " + username + "!");
      }

      return data.message === true;
    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return 0;
    }
  }

  static async getUsersMessageSent(filename, howerUsername) {
    try {
      const payload = {
        filename,
        howerUsername
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/get-messages-sent/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return 0;
      }

      return data.message;
    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return 0;
    }
  }




  static async increment_reinspect_count(username, token, userInspected) {
    try {
      const payload = {
        username,
        token,
        instance_name: userInspected,
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/increment-reinspect-count/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return 0;
      }

      return data.message === true;
    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return 0;
    }
  }

  static async get_reinspect_count(username, token, userInspected) {
    try {
      const payload = {
        username,
        token,
        instance_name: userInspected,
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/get-reinspect-count/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return 0;
      }

      return data.message;
    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return 0;
    }
  }

  static async delete_reinspect_index(username, token, filename) {
    try {
      const payload = {
        username,
        token,
        filename,
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/delete-reinspect-index/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return false;
      }

      return data.message === true;
    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return false;
    }
  }

  // functions for getting index
  static async getReinspectIndex(username, token, filename) {
    try {
      const payload = {
        username,
        token,
        filename,
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/get-reinspect-index/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return false;
      }

      return data.message;
    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return false;
    }
  }

  static async setReinspectIndex(username, token, filename, index) {
    try {
      const payload = {
        username,
        token,
        filename,
        index,
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/set-reinspect-index/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return false;
      }

      return data.message === true;
    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return false;
    }
  }

  // end of functions

  static async changeUserConf(username, token, confToChange, newValue) {
    try {
      const payload = {
        username,
        token,
        confToChange,
        newValue,
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/update-user-conf/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return false;
      }

      return data.message === true;
    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return false;
    }
  }

  static async getProfileConf(username, token) {
    // here we can view the popups available
    try {
      const payload = {
        username,
        token,
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/get-user-conf/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return false;
      }

      return data.message;
    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return false;
    }
  }

  static async getIGPoolAccounts(username, token) {
    // here we can view the popups available
    try {
      const payload = {
        username,
        token,
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/get-ig-pool-accounts/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return false;
      }

      return data.message;
    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return false;
    }
  }

  static async sendStatusEmail(username, usernameInspected, message) {
    try {
      const payload = {
        username,
        usernameInspected,
        message: message,
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/send-status-email/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return false;
      }

      return true;
    } catch (ex) {
      if (DEBUG) console.error("Error during email send:", ex);
      return false;
    }
  }

  static async tokenNeedsValidation(username, token) {
    try {
      const payload = {
        username,
        token,
        curr_time: new Date().toISOString().slice(0, 10), // Format as "YYYY-MM-DD"
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/validate-token/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "validate_required" || data.status === "error") {
        return false;
      }

      return true;
    } catch (ex) {
      if (DEBUG) console.error("Error during token validation:", ex);
      return false;
    }
  }

  static async setUsernamesInspected(
    username,
    token,
    instance_name,
    username_inspected
  ) {
    try {
      const payload = {
        instance_name,
        username_inspected,
        username,
        token,
      };

      const response = await fetch(
        `${HOWER_API_ENDPOINT}/clients/api/set-usernames-inspected/`,
        {
          method: "POST",
          body: JSON.stringify(JSON.stringify(payload)),
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      if (data.status === "error") {
        return false;
      }

      return true;
    } catch (ex) {
      if (DEBUG) console.error("Error during setting usernames:", ex);
      return false;
    }
  }

  static async postData(url = "", data = {}) {
    const response = await fetch(url, {
      method: "POST",
      body: JSON.stringify(JSON.stringify(data)),
    });
    return response.json();
  }

  // Equivalent implementation of start_instance in JavaScript
  static async startInstance(username, token, userInspected) {
    try {
      const payload = {
        username: username,
        token: token,
        instance_name: userInspected,
      };

      const apiUrl = `${HOWER_API_ENDPOINT}/clients/api/start-instance/`;
      const response = await HowerAPI.postData(apiUrl, payload);

      return response.status === "success";
    } catch (error) {
      if (DEBUG) console.error("Error during instance start:", error);
      return false;
    }
  }

  static async endInstance(
    username,
    token,
    userInspected,
    accounts,
    emails,
    phoneNums
  ) {
    try {
      const payload = {
        username: username,
        token: token,
        instance_name: userInspected,
        accounts: accounts,
        emails: emails,
        phone_nums: phoneNums,
      };

      const apiUrl = `${HOWER_API_ENDPOINT}/clients/api/end-instance/`;
      const response = await HowerAPI.postData(apiUrl, payload);

      return response.status === "success";
    } catch (error) {
      if (DEBUG) console.error(error);
      return false;
    }
  }

  static async updateInstanceData(
    username,
    token,
    userInspected,
    fullData,
    index,
    countAccounts,
    countEmails,
    countPhoneNumbers,
    endCursor
  ) {
    try {
      const payload = {
        username: username,
        token: token,
        instance_name: userInspected,
        full_data: JSON.stringify(fullData),
        index: index,
        count_accounts: countAccounts,
        count_emails: countEmails,
        count_numbers: countPhoneNumbers,
        end_cursor: endCursor,
      };
      const apiUrl = `${HOWER_API_ENDPOINT}/clients/api/update-instance/`;
      //const apiUrl = `${HOWER_APIENDPOINT}/clients/api/update-instance/`;
      const response = await HowerAPI.postData(apiUrl, payload);

      return response.status === "success";
    } catch (error) {
      if (DEBUG) console.error(error);
      return false;
    }
  }

  static async restartInstance(username, token, userInspected) {
    try {
      const payload = {
        username: username,
        token: token,
        instance_name: userInspected,
      };

      const apiUrl = `${HOWER_API_ENDPOINT}/clients/api/restart-instance/`;
      const response = await HowerAPI.postData(apiUrl, payload);

      return response;
    } catch (error) {
      if (DEBUG) console.error("Error during instance start:", error);
      return null;
    }
  }

  static async decrementInspectionsByOne(username, token) {
    await HowerAPI.decrementInspections(username, token, 1);
  }

  static async decrementInspections(username, token, used_inspections) {
    try {
      const payload = {
        username: username,
        token: token,
        used_inspections: used_inspections,
      };

      const apiUrl = `${HOWER_API_ENDPOINT}/clients/api/decrement-inspections/`;
      const response = await HowerAPI.postData(apiUrl, payload);

      return response.status;
    } catch (error) {
      if (DEBUG) console.error("Error during instance start:", error);
      return false;
    }
  }

  static async getRemainingInspections(username, token) {
    try {
      const payload = {
        username: username,
        token: token,
      };

      const apiUrl = `${HOWER_API_ENDPOINT}/clients/api/get-remaining-inspections/`;
      const response = await HowerAPI.postData(apiUrl, payload);

      return parseInt(response.message);
    } catch (error) {
      if (DEBUG) console.error("Error during instance start:", error);
      return 0;
    }
  }

  static async isInstanceExisting(username, token, instanceName) {
    try {
      const payload = {
        username: username,
        token: token,
        instance_name: instanceName,
      };

      const apiUrl = `${HOWER_API_ENDPOINT}/clients/api/is-instance-existing/`;
      const response = await HowerAPI.postData(apiUrl, payload);

      return (
        response.message === true ||
        response.message.toString().toLowerCase() === "true"
      );
    } catch (error) {
      if (DEBUG) console.error("Error during instance start:", error);
      return 0;
    }
  }
}

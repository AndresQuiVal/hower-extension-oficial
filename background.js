// // Global vars
var usersMessageSent = []; // stores the users whose messages have been sent



function sendTabKey(tabId) {
  chrome.debugger.attach({ tabId: tabId }, '1.3', function() {
      chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchKeyEvent', {
          type: 'keyDown',
          windowsVirtualKeyCode: 9,
          nativeVirtualKeyCode: 9,
          macCharCode: 9,
          key: "Tab"
      }, function() {
          chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchKeyEvent', {
              type: 'keyUp',
              windowsVirtualKeyCode: 9,
              nativeVirtualKeyCode: 9,
              macCharCode: 9,
              key: "Tab"
          }, function() {
              chrome.debugger.detach({ tabId: tabId });
          });
      });
  });
}



let logs = [];

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveLog') {
    console.error(`[BACKGROUND] - Descargando logs...`);
    logs.push(request.log);
    
    if (logs.length >= 100) {
      downloadLogs();
    }
  }
});

function downloadLogs() {
  console.error(`[BACKGROUND] - Descargando logs...`);
  
  // Crear una data URL directamente
  const content = logs.join('\n');
  const dataUrl = 'data:text/plain;charset=utf-8,' + encodeURIComponent(content);
  
  // Crear un nombre de archivo seguro con la fecha actual
  const now = new Date();
  const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}`;
  
  chrome.downloads.download({
    url: dataUrl,
    filename: `hower_logs_${timestamp}.txt`,
    saveAs: false
  });

  console.error(`[BACKGROUND] - Logs descargados`);
  logs = [];
}


chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // Inyectar el script en la pestaña actual
    chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        // Este código será inyectado como content script
        function keepAlive() {
          document.body.style.transform = `scale(${1 + Math.random() * 0.0001})`;
          console.log('Manteniendo render activo...');
          requestAnimationFrame(keepAlive);
        }
        keepAlive();
      }
    }, () => {
      if (chrome.runtime.lastError) {
        console.error('Error inyectando el script:', chrome.runtime.lastError.message);
      } else {
        console.log('Script inyectado correctamente.');
      }
    });
  }
});




chrome.alarms.create('keepAlive', { periodInMinutes: 5 });

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    console.log('Manteniendo Background.js activo');
  }
});


chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  
  if (message.action === "buttonMessageClicked") {
      // here writtes the message
      console.error(`[BACKGROUND] - Recibiendo mensaje a enviar!!'`);
      chrome.debugger.attach({ tabId: message.instaTabId }, '1.3', async () => {
              console.error(message.messageToSend);
              //setTimeout(async () => {
                // const { x, y } = message.coordinates;
                // await simulateMouseClick(message.instaTabId, x, y);
                // setTimeout(async  () => {
                    await sendMessage(message.instaTabId , message.messageToSend);
                    chrome.debugger.detach({ tabId: message.instaTabId  });
                // }, 10000);
              // },1000);
      });
  } else if  (message.action === "tabStoryMessage") {
    console.error(`[BACKGROUND] - Recibiendo mensaje a enviar  'TAB!!'`);
      console.error(message.instaTabId);
      chrome.debugger.attach({ tabId: message.instaTabId }, '1.3', () => {
          setTimeout(async  () => {
              await dispatchTabKeyEvent(message.instaTabId, 100);
              chrome.debugger.detach({ tabId: message.instaTabId  });
          }, 1000);
      });
  } else if (message.action === "tabStoryMessageTab") {
      console.error(message.instaTabId);
      chrome.debugger.attach({ tabId: message.instaTabId }, '1.3', () => {
          setTimeout(async  () => {
              await dispatchTabKeyEventTab(message.instaTabId, 100);
              chrome.debugger.detach({ tabId: message.instaTabId  });
          }, 500);
      });
  } else if (message.action === 'focusTextbox') {
    console.error(`[BACKGROUND] - Recibiendo enfoque textbox`);
    var tabId = message.instaTabId; // Get the tab ID from the sender
    sendTabKey(tabId);
  } else if (message.action === 'tabStory') {
    console.error(`[BACKGROUND] - Recibiendo tab de story`);
    var tabId = message.instaTabId; // Get the tab ID from the sender
    sendTabKey(tabId);
  } else if (message.action === 'userMessageSent') {
    console.error(`[BACKGROUND] - Recibiendo mensaje enviado por userMessageSent`);
    let usernameMessageSent = message.usernameMessageSent;
    const now = new Date();

    // Obtener los componentes de la fecha y hora
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');

    const formattedDateTime = `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;

    usersMessageSent.push({
      username: usernameMessageSent,
      message_time_sent: formattedDateTime
    });

    chrome.runtime.sendMessage({ action: "userMessageSentFront", username: usernameMessageSent, message_time_sent: formattedDateTime })

    // if (usersMessageSent.length === parseInt(message.messagesLimit)) {
    //   chrome.runtime.sendMessage({ action: "createMessagesDoneFileScript", users: JSON.stringify(usersMessageSent)  }, function(response) {
    //     //
    //   });
    // }

     // console.log("LISTA ACTIUAL DE USUARIOS ENVIADOS MENSAJE: " + JSON.stringify(usersMessageSent));
  } else if (message.action === 'createMessagesDoneFile') {
    // create the .csv file to generate the success users
    console.error(`[BACKGROUND] - Recibiendo creadcion de archivo de mensajes enviados`);
    chrome.runtime.sendMessage({ action: "createMessagesDoneFileScript", users: JSON.stringify(usersMessageSent)  }, function(response) {
      //
    });
  } else if (message.action === 'rotateProxy') { 
    // setProxy(); // here we rotate the proxy
  } else if (message.action === 'pressEnter') {
    pressedEnter(message.instaTabId);
  } else if (message.action === 'escapeClicked') {
    pressedEscape(message.instaTabId);
  } else if (message.action === 'ignoreUser') {
    console.error(`[BACKGROUND] - Recibiendo ignorar usuario`);
    chrome.runtime.sendMessage({ action: "ignoreUserFront" }, function(response) {
      //
    });
  } else if (message.action === 'ignoreUserComplete') {
    console.error(`[BACKGROUND] - Recibiendo ignorar usuario completo`);
    chrome.runtime.sendMessage({ action: "ignoreUserCompleteFront" }, function(response) {
      //
    });
  } else if (message.action === "userMessageNotAllowed") {
    console.error(`[BACKGROUND] - Recibiendo no se puede enviar mensaje`);
    chrome.runtime.sendMessage({ action: "userMessageNotAllowedFront", usernameMessageSent : message.usernameMessageSent }, function(response) {
      //
    });
  } else if (message.action === "userMessageMessageButtonBan") {
    console.error(`[BACKGROUND] - Recibiendo que estamos baneados del boton`);
    chrome.runtime.sendMessage({ action: "userMessageMessageButtonBanFront" }, function(response) {
      //
    });
  }else if (message.action === "userMessageNotButton") {
    console.error(`[BACKGROUND] - Recibiendo no hay boton`);
    chrome.runtime.sendMessage({ action: "userMessageNotButtonFront" }, function(response) {
      //
    });
  } else if (message.action === "isPrivateAccount") {
    console.error(`[BACKGROUND] - Recibiendo es cuenta privada`);
    chrome.runtime.sendMessage({ action: "isPrivateAccountFront", usernameMessageSent : message.usernameMessageSent }, function(response) {
      //
    });
  } else if (message.action === "SHOW_NOTIFICATION") {
    console.error(`[BACKGROUND] - Recibiendo notificacion!!!!!!!!!!!!!!!!!`);
    chrome.notifications.create('', {
      type: 'basic',
      iconUrl: chrome.runtime.getURL('Hower_logo.png'), // Asegúrate de que esta ruta sea correcta
      title: message.title,
      message: message.message,
      priority: 1
    });
  } else if (message.action === "readyListNewFollowers") {
    console.error(`[BACKGROUND] - Recibiendo lista de nuevos seguidores`);
    console.error(message.usernamesNewFollowers);

    chrome.runtime.sendMessage({ action: "readyListNewFollowersFront", usernamesNewFollowers: message.usernamesNewFollowers });
  }

  // Return true to indicate that you will send a response asynchronously
  return true;
});



function objectToCsvRow(obj) {
  return `${obj.username},${obj.message_time_sent}\n`;
}






var HOWER_API_ENDPOINT = "https://hower-website-production.up.railway.app";

async function getLatestMessageSent(username, token) {
  try {
    const payload = {
      howerUsername: username,
      howerToken: token,
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

    return true;
  } catch (ex) {
    console.error("Error getting latest message:", ex);
    return false;
  }
}


const notificationMessages = [
  {
    title: "Es hora de prospectar",
    message: "¿Tan fácil que es prospectar? ¡Ábreme para continuar con esa prospección!"
  },
  {
    title: "¡Momento de conectar!",
    message: "Tus prospectos están esperando. ¿Comenzamos?"
  },
  {
    title: "¡Nueva oportunidad!",
    message: "La constancia es la clave del éxito. ¡Sigamos prospectando!"
  },
  {
    title: "¡Hower te necesita!",
    message: "Hay nuevos prospectos esperando por ti. ¡Empecemos!"
  },
  {
    title: "¡Es tu momento!",
    message: "Los mejores resultados vienen de la acción constante. ¡Vamos!"
  }
];

function getRandomNotification() {
  return notificationMessages[Math.floor(Math.random() * notificationMessages.length)];
}

async function checkAndNotify() {
  // Obtener credenciales guardadas
  try {
    chrome.storage.local.get(['username', 'token'], async function(result) {
      if (result.username && result.token) {
        try {
          const messages = await getLatestMessageSent(result.username, result.token);
          if (messages) {
            const notification = getRandomNotification();
            chrome.notifications.create('', {
              type: 'basic',
              iconUrl: chrome.runtime.getURL('Hower_logo.png'),
              title: notification.title,
              message: notification.message,
              priority: 1
            });
          } else {
            console.error("[BACKGROUND] - No hay mensajes nuevos");
          }
        } catch (error) {
          console.error('Error checking messages:', error);
        }
      }
     });
  } catch (error) {
    console.error('Error checking messages:', error);
  }
}

// Ejecutar cuando Chrome inicia
chrome.runtime.onStartup.addListener(() => {
  checkAndNotify();
});

// Ejecutar cuando la extensión se instala o actualiza
chrome.runtime.onInstalled.addListener(() => {
  checkAndNotify();
});




function createCSVOfSuccessUsers(dataList) {
  // Convert the list of objects to a CSV string
  const csvContent = dataList.reduce((csv, obj) => {
    return csv + objectToCsvRow(obj);
  }, 'Username,Message Time Sent\n'); // Add header row

  // Convert the CSV string to a Blob
  const blob = new Blob([csvContent], { type: 'text/csv' });

  // Generate a filename
  const filename = 'success_users.csv';

  // Download the CSV file
  chrome.downloads.download({
    url: URL.createObjectURL(blob),//chrome.runtime.getURL(new Blob([csvContent], { type: 'text/csv' })),
    filename: filename,
    saveAs: true // Prompt the user to choose a download location
  }, function(downloadId) {
    // Optional callback function
    console.log('CSV download started with id:', downloadId);
  });
}





chrome.webNavigation.onCompleted.addListener(async (details) => {
  // frame principal
  console.error("Llegamos por aca!!!! = " + details.url.toString() + " tab id " + details.tabId.toString());
  if (details.frameId !== 0) return;
  console.error("Avanzando!");

  const { pendingDM } = await chrome.storage.local.get("pendingDM");
  if (!pendingDM) return;
  if (details.tabId !== pendingDM.tabId) return;               // solo nuestro tab
  if (!/https:\/\/www\.instagram\.com\/(?:m|direct)\//.test(details.url)) return;

  await chrome.scripting.executeScript({
    target: { tabId: details.tabId },
  
    func: ({ text, username, messagesLimit }) => {

      const findBlockedMessageDivsTextbox = () => {
        // Buscar mensajes de error comunes cuando no se puede enviar mensaje
        const errorMessages = [
          "No todos pueden enviar mensajes a esta cuenta",
          "Not everyone can send messages to this account",
          "No se pueden enviar mensajes a esta cuenta",
          "Esta cuenta no acepta mensajes"
        ];
      
        // Buscar en elementos de texto y aria-labels
        const textElements = document.querySelectorAll("div, span, p");
        for (const element of textElements) {
          const text = element.textContent?.toLowerCase() || "";
          const ariaLabel = element.getAttribute("aria-label")?.toLowerCase() || "";
      
          for (const errorMsg of errorMessages) {
            if (text.includes(errorMsg.toLowerCase()) || ariaLabel.includes(errorMsg.toLowerCase())) {
              return true;
            }
          }
        }
      
        return false;
      };


      const showOverlay = (message) => {
        const overlay = document.createElement('div');
        overlay.id = 'messageOverlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)'; // Fondo semi-transparente
        overlay.style.color = 'white';
        overlay.style.fontSize = '24px';
        overlay.style.display = 'flex';
        overlay.style.alignItems = 'center';
        overlay.style.justifyContent = 'center';
        overlay.style.zIndex = '9999'; // Asegúrate de que esté por encima de otros elementos
      
        // Crear el mensaje
        const messageText = document.createElement('div');
        messageText.textContent = message;
        messageText.style.textAlign = 'center';
        
        // Agregar el mensaje al overlay
        overlay.appendChild(messageText);
        
        // Agregar el overlay al body
        document.body.appendChild(overlay);
      };
      
  
      /* ───── helpers ───── */
      const waitFor = (sel, t = 15000) =>
        new Promise((res, rej) => {
          const q = () => document.querySelector(sel);
          if (q()) return res(q());

          const hasFound = findBlockedMessageDivsTextbox();
          if (hasFound) { 
            return rej("account_blocked");
          }

          const mo = new MutationObserver(() => q() && (mo.disconnect(), res(q())));
          mo.observe(document, { childList: true, subtree: true });
          setTimeout(() => { mo.disconnect(); rej("timeout "+sel); }, t * 2);
        });
  
      const nativeClick = el => {
        if (!el) return;
        const {left,top,width,height} = el.getBoundingClientRect();
        const cx = left + width / 2, cy = top + height / 2;
        ["pointerdown","mousedown","mouseup","pointerup","click"].forEach(type =>
          el.dispatchEvent(new MouseEvent(type,{bubbles:true,clientX:cx,clientY:cy,buttons:1}))
        );
      };

      const isConversationRepeated = ()  => {
        // Selecciona todos los elementos que tienen un atributo aria-label
        const texts = ["Double tap to like", "Toca dos veces para darle me gusta", ]; // FALTA VALIDAR MÁS
        const elements = document.querySelectorAll('[aria-label]');
        
        // Itera sobre los elementos y verifica si alguno contiene el texto
        for (const element of elements) {
          for (const text of texts) {
            if (element.getAttribute('aria-label').includes(text)) {
              return true;
            }
          }
        }
        
        // Si ningún elemento contiene el texto, retorna false
        return false;
      };


      const checkIfErrorIsShown = () => {
        console.log("[INJECT] Buscando error de envío");
      
        // Buscar elementos que contengan los mensajes de error
        const errorMessages = [
          'Something went wrong',
          'Algo salió mal',
          'Algo salio mal',
          'No se puede enviar'
        ];
      
        // Buscar en todos los elementos div del DOM
        const divs = document.querySelectorAll('div');
        for (let div of divs) {
          if (errorMessages.some(message => div.textContent.toLowerCase().includes(message.toLowerCase()))) {
            console.log("[INJECT] Error de envío encontrado");
            return true;
          }
        }
      
        console.log("[INJECT] No se encontró error de envío");
        return false;
      };
      


      
      /* ──────────────────── */
  
      (async () => {
        try {

          console.log("[INJECT] esperando textarea…");
          // -----
            /* 1· esperar textarea listo y delay de 5 s */
            let retries = 3;
            let textarea = null;
            
            while (retries > 0) {
              try {
                textarea = await waitFor('div[role="textbox"][contenteditable="true"]');
                break; // Si encontramos el textarea, salimos del bucle
              } catch (error) {
                if (error === "account_blocked") {
                  chrome.runtime.sendMessage({
                    action: "userMessageNotAllowed",
                    usernameMessageSent: username
                  });
                  return;
                }
                
                retries--;
                if (retries === 0) throw error;
                
                console.log(`[INJECT] Reintentando encontrar textarea... (${retries} intentos restantes)`);
                await new Promise(r => setTimeout(r, 2000)); // Esperar 2 segundos entre reintentos
              }
            }

            
            showOverlay("Hower está enviando mensajes...");

            await new Promise(r=>setTimeout(r,5000));
            
            // Verificar conversaciones previas!
            let existsConversation = isConversationRepeated();
          
            if (existsConversation && !details.sendMessagesToPreviousConversations) {
              // skip user
              chrome.runtime.sendMessage({
                action: "isPrivateAccount",
                usernameMessageSent : usernameInsta
              });
              return;
            }

            /* 2· pegar TODO el texto */
            let box=document.querySelector('div[role="textbox"][contenteditable="true"]');
            box.textContent=''; box.focus();
            const sel=window.getSelection(),range=document.createRange();
            range.selectNodeContents(box); range.collapse(false);
            sel.removeAllRanges(); sel.addRange(range);
            document.execCommand('insertText',false,text);
            box.dispatchEvent(new InputEvent('input',{bubbles:true,data:null}));

            /* ✱ N U E V O  ➜  “a” keydown / keyup para que React habilite el avión */
            ['keydown','beforeinput','keyup'].forEach(t =>
              box.dispatchEvent(new KeyboardEvent(t,{
                bubbles:true,cancelable:true,
                key:'a',code:'KeyA',keyCode:65,charCode:65,which:65
              }))
            );

            await new Promise(resolve => setTimeout(resolve, 100));

            
            // estamos probando esto...
            const getSendBtn = () =>
              document.querySelector('svg[aria-label="Send"]')?.closest('div[role="button"]') ||
              document.querySelector('svg[aria-label="Enviar"]')?.closest('div[role="button"]') ||
              document.querySelector('svg[aria-label="Enviar mensaje"]')?.closest('div[role="button"]') ||
              Array.from(document.querySelectorAll('div[role="button"][tabindex="0"]'))
                .find(d => /^(send|enviar)$/i.test(d.textContent.trim())) || null;
      
            const btn = await new Promise((resolve, reject) => {
              const start = Date.now();
              (function poll() {
                const b = getSendBtn();
                if (b && !b.closest('[aria-disabled="true"]')) {
                  return resolve(b);
                }
                if (Date.now() - start > 10000) {
                  return reject("Botón nunca habilitado");
                }
                setTimeout(poll, document.hidden ? 1000 : 100);
              })();
            }).catch(err => {
              console.warn("[INJECT] polling error:", err);
              return null;
            });
      
            // 3) Click nativo o fallback Enter
            if (btn) {
              console.log("[INJECT] botón habilitado – clic nativo");
              nativeClick(btn);
            } else {
              console.warn("[INJECT] botón siguió gris – envío Enter fallback");
              ['keydown','keypress','keyup'].forEach(type =>
                box.dispatchEvent(new KeyboardEvent(type,{
                  bubbles:true,cancelable:true,
                  key:'Enter',code:'Enter',
                  keyCode:13,charCode:13,which:13
                }))
              );
            }
            // fin de prueba...
            
          //  let sendBtn =
          //     document.querySelector('svg[aria-label="Enviar"]')?.closest('div[role="button"]') ||
          //     document.querySelector('svg[aria-label="Enviar mensaje"]')?.closest('div[role="button"]');
  
          // if (!sendBtn) {
          //   const divButtons = Array.from(document.querySelectorAll('div[role="button"][tabindex="0"]'));
          //   sendBtn = divButtons.find(d => /^(send|enviar)$/i.test(d.textContent.trim())) || null;
          // }
  
          // /* clic o Enter */
          // if (sendBtn && !sendBtn.closest('[aria-disabled="true"]')) {
          //   console.error("[INJECT] botón activo, clic nativo");
          //   nativeClick(sendBtn);
          // } else {
          //   console.error("[INJECT] botón inactivo, enviando Enter como fallback");
          //   const box = document.querySelector('div[role="textbox"][contenteditable="true"]');
          //   box.dispatchEvent(new KeyboardEvent('keydown',{bubbles:true,key:'Enter',code:'Enter',keyCode:13}));
          //   box.dispatchEvent(new KeyboardEvent('keyup'  ,{bubbles:true,key:'Enter',code:'Enter',keyCode:13}));
          // }

          // -----
  
       
          setTimeout(() => {
            const blocked = typeof findBlockedMessageDivs === "function" && findBlockedMessageDivs();
            const err     = typeof checkIfErrorIsShown     === "function" && checkIfErrorIsShown();
  
            if (err || blocked !== false) {
              console.error("[INJECT] bloqueo/error detectado");
              chrome.runtime.sendMessage({
                action: "userMessageNotAllowed",
                usernameMessageSent: username
              });
            } else {
              console.error("[INJECT] éxito - userMessageSent");
              chrome.runtime.sendMessage({
                action: "userMessageSent",
                usernameMessageSent: username,
                messagesLimit
              });
            }
          }, 30000);   // mismo delay que usabas (27-30 s)
  
        } catch (e) {
          console.warn("[INJECT] error:", e);
          chrome.runtime.sendMessage({
            action: "userMessageNotAllowed",
            usernameMessageSent: username
          });
        }
      })();
    },
  
    args: [{
      text: pendingDM.message,
      username: pendingDM.username,
      messagesLimit: 1000
    }]
  });
  
  
  
 
   chrome.storage.local.remove("pendingDM");
});


function loadPopupWindowId() {
  return new Promise((resolve) => {
    chrome.storage.local.get(["popupWindowId"], (result) => {
      resolve(result.popupWindowId);
    });
  });
}


let popupWindowId = null;

// Abrir la ventana popup y guardar su ID
chrome.action.onClicked.addListener(() => {
  chrome.windows.create({
    url: chrome.runtime.getURL('index.html'),
    type: 'popup',
    width: 400,
    height: 800,
    left: 100,
    top: 100,
    focused: true
  }, (window) => {
    chrome.storage.local.set({ popupWindowId : window.id });
    popupWindowId = window.id;
  });
});

// Detectar si la ventana ha sido minimizada
// chrome.windows.onFocusChanged.addListener(async (windowId) => {
//   popupWindowId = await loadPopupWindowId();
//   console.error("POPUP WINDOW ID " + popupWindowId);
//   if (popupWindowId) {
//     console.error("ESTMAMOS " + windowId + " POPUP WINDOW " + popupWindowId + " WINDOW_ID_NONE " + chrome.windows.WINDOW_ID_NONE);
//     if (windowId === chrome.windows.WINDOW_ID_NONE && popupWindowId) {
//       // La ventana ha perdido el foco, posiblemente minimizada
//       chrome.windows.get(popupWindowId, (window) => {
//         if (window.state === "minimized") {
//           // Restaurar la ventana si está minimizada
//           chrome.windows.update(popupWindowId, { state: "normal" });
//         }
//       });
//     }
//   }
// });


// chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
//   if (changeInfo.status == 'complete' && tab.url.includes('instagram.com')) {
//       chrome.scripting.executeScript({
//           target: { tabId: tabId },
//           files: ['content.js']
//       });
//   }
// });


// chrome.action.onClicked.addListener(async (tab) => {
//   // Open Instagram Inbox
//   // let instaTab = await chrome.tabs.create({ url: 'https://www.instagram.com/direct/inbox/' });

//   // Wait for the tab to be fully loaded
//   await new Promise(resolve => {
//       chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
//           if (info.status === 'complete' && tabId === instaTab.id) {
//               chrome.tabs.onUpdated.removeListener(listener);
//               resolve();
//           }
//       });
//   });

//   // Now send the message
//   try {
//       await chrome.tabs.sendMessage(instaTab.id, { action: "sendMessage", username: "the_username", message: "Hello!" });
//   } catch (error) {
//       console.error('Error sending message:', error);
//   }
// });




function triggerSendMessage(tabId, username, message) {
  chrome.tabs.sendMessage(tabId, { action: 'sendMessage', username, message });
}

// You'll need some logic to determine when to call triggerSendMessage
// triggerSendMessage(tabId, "valdovinosandresquiroz", "hola");


async function simulateMouseClick(tabId, x, y, delay = 0) {
  console.error("X: " + x + " Y: " + y);
  y = y - 50;

  const mouseDownParams = {
    type: 'mousePressed',
    x: x,
    y: y,
    button: 'left',
    clickCount: 1
  };
  
  const mouseUpParams = {
      type: 'mouseReleased',
      x: x,
      y: y,
      button: 'left',
      clickCount: 1
  };

  // Simulate mouse down event
  chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchMouseEvent', mouseDownParams);
  chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchMouseEvent', mouseUpParams);
  // await sleep(delay);

  console.error("YA PRESIONAMOS CON EL CLICK DE DISPATCH MOUSE!");
}





function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function dispatchKeyEventWithDelay(tabId, key, delay) {
  const keyDownParams = { type: 'keyDown', text: key };
  const keyUpParams = { type: 'keyUp' };

  await chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchKeyEvent', keyDownParams);
  await sleep(delay);
  await chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchKeyEvent', keyUpParams);
  await sleep(delay);
}

async function dispatchTabKeyEvent(tabId, delay) {
  console.error("MAKING SPACE....")
  const keyDownParams = {
      type: "keyDown",
      windowsVirtualKeyCode: 32,  // El código de tecla virtual para Tab en Windows
      nativeVirtualKeyCode: 32,   // El código de tecla virtual nativo para Tab
      macCharCode: 32,            // El código de tecla en macOS
      key: "Space",                // La representación como cadena de la tecla
  };
  const keyUpParams = {
      type: "keyUp",
      windowsVirtualKeyCode: 32,  // El código de tecla virtual para Space en Windows
      nativeVirtualKeyCode: 32,   // El código de tecla virtual nativo para Space
      macCharCode: 32,            // El código de tecla en macOS
      key: "Space",                // La representación como cadena de la tecla
    };

  await chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchKeyEvent', keyDownParams);
  await sleep(delay);
  await chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchKeyEvent', keyUpParams);
  await sleep(delay);
}


async function dispatchTabKeyEventTab(tabId, delay) {
  console.error("MAKING TAB....")
  const keyDownParams = {
      type: "keyDown",
      windowsVirtualKeyCode: 9,  // El código de tecla virtual para Tab en Windows
      nativeVirtualKeyCode: 9,   // El código de tecla virtual nativo para Tab
      macCharCode: 9,            // El código de tecla en macOS
      key: "Tab",                // La representación como cadena de la tecla
  };
  const keyUpParams = {
      type: "keyUp",
      windowsVirtualKeyCode: 9,  // El código de tecla virtual para Tab en Windows
      nativeVirtualKeyCode: 9,   // El código de tecla virtual nativo para Tab
      macCharCode: 9,            // El código de tecla en macOS
      key: "Tab",                // La representación como cadena de la tecla
    };

  await chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchKeyEvent', keyDownParams);
  await sleep(delay);
  await chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchKeyEvent', keyUpParams);
  await sleep(delay);
}





async function simulateTyping(tabId, message, delay = 0) {
  const formattedMessage = message.replace(/\n/g, '\n'); // Mantener los saltos de línea

  delay = Math.floor(Math.random() * 31);

  for (const char of formattedMessage) {
      await dispatchKeyEventWithDelay(tabId, char, delay);
  }

  await pressedEnter(tabId);
  await new Promise(resolve => setTimeout(resolve, 2000));
  await pressedEnter(tabId);
}


// async function pressedEnter(tabId) {
//   await chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchKeyEvent', { "type": "rawKeyDown", "windowsVirtualKeyCode": 13, "unmodifiedText": "\r", "text": "\r" })
//   await chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchKeyEvent', { "type": "char", "windowsVirtualKeyCode": 13, "unmodifiedText": "\r", "text": "\r" })
//   await chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchKeyEvent', { "type": "keyUp", "windowsVirtualKeyCode": 13, "unmodifiedText": "\r", "text": "\r" })
// }


async function pressedEnter(tabId) {
  await chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchKeyEvent', {
    type: "keyDown",
    windowsVirtualKeyCode: 13,
    code: "Enter",
    key: "Enter",
    text: "\r"
  });
  
  await chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchKeyEvent', {
    type: "keyUp",
    windowsVirtualKeyCode: 13,
    code: "Enter",
    key: "Enter",
    text: "\r"
  });
}


async function pressedEscape(tabId) {
  await chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchKeyEvent', {
    type: "keyDown",
    windowsVirtualKeyCode: 27, // Código de tecla para Escape
    code: "Escape",
    key: "Escape",
    text: ""
  });
  
  await chrome.debugger.sendCommand({ tabId: tabId }, 'Input.dispatchKeyEvent', {
    type: "keyUp",
    windowsVirtualKeyCode: 27, // Código de tecla para Escape
    code: "Escape",
    key: "Escape",
    text: ""
  });
}


async function sendMessage(tabId, message) {
  await simulateTyping(tabId, message);
  // await dispatchKeyEventWithDelay(tabId, 'Enter'); // Simulate pressing Enter to send the message
}








function triggerSendMessage(tabId, username, message) {
chrome.tabs.sendMessage(tabId, { action: 'sendMessage', username, message });
}

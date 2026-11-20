// הצהרת הנגישות: תאריך ופרטי הקשר מ-config.js. קובץ נפרד ולא בתוך הדף, בגלל מדיניות האבטחה (CSP).
(function(){var C=window.IRONBEN_CONFIG||{};document.getElementById("a-date").textContent=C.A11Y_STATEMENT_DATE||"";
var parts=[];if(C.A11Y_CONTACT_NAME)parts.push("רכז/ת הנגישות: "+C.A11Y_CONTACT_NAME+".");
if(C.PHONE_DISPLAY)parts.push('טלפון: <a href="tel:'+C.PHONE_DISPLAY.replace(/[^0-9+]/g,"")+'">'+C.PHONE_DISPLAY+"</a>.");
if(C.EMAIL)parts.push('מייל: <a href="mailto:'+C.EMAIL+'">'+C.EMAIL+"</a>.");
if(C.WHATSAPP)parts.push('וואטסאפ: <a href="https://wa.me/'+C.WHATSAPP+'" target="_blank" rel="noopener">שליחת הודעה</a>.');
document.getElementById("a-contact").innerHTML=parts.join(" ");})();

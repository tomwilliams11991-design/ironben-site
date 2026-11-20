// דף ההסרה מרשימת התפוצה: שולח את הקישור החתום לפונקציה ironben-unsubscribe. קובץ נפרד ולא בתוך הדף, בגלל מדיניות האבטחה (CSP).
(async function(){
  var p=new URLSearchParams(location.search),m=document.getElementById('msg'),C=window.IRONBEN_CONFIG||{};
  if(!p.get('e')||!p.get('s')||!C.SUPABASE_URL){m.textContent='הקישור חסר או לא תקין. אפשר להשיב "הסר" למייל שקיבלתם.';return;}
  try{
    var r=await fetch(C.SUPABASE_URL+'/functions/v1/'+(C.FUNCTIONS_PREFIX||'ironben-')+'unsubscribe',{method:'POST',headers:{'Content-Type':'application/json','apikey':C.SUPABASE_ANON_KEY},body:JSON.stringify({e:p.get('e'),s:p.get('s')})});
    var j=await r.json();
    m.textContent=j.ok?'הכתובת '+p.get('e')+' הוסרה. לא נשלח אליה יותר פניות.':'הקישור לא תקין. אפשר להשיב "הסר" למייל שקיבלתם.';
  }catch(e){m.textContent='ההסרה לא הצליחה כרגע. אפשר להשיב "הסר" למייל שקיבלתם ונסיר ידנית.';}
})();

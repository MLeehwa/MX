Skip to content
Leehwa SCM's projects
Leehwa SCM's projects

Hobby

lhswp-1

4dPGHwH6Z



Source
Output
pda/js/pda_receiving.js

      const { error: logError } = await supabase
        .from('receiving_log')
        .insert({
          label_id: currentReceivingPlan.label_id,
          received_at: etTime.toISOString(),
          confirmed_by: 'pda_user',
          quantity: quantity,
          location_code: location
        });
      if (logError) throw logError;
      showMessage('Receiving completed successfully', 'success');
      resetForm();
      barcodeInput.focus();
    } catch (error) {
      console.error('Error:', error);
      showMessage('Error completing receiving', 'error');
    }
  }

  function resetForm() {
      receivingInfo.classList.add('hidden')
      receivingForm.classList.add('hidden')
      document.getElementById('quantity').value = ''
      document.getElementById('location').value = ''
      currentReceivingPlan = null
  }

  const successAudio = new Audio('../sounds/success.mp3');
  const errorAudio = new Audio('../sounds/wrong.mp3');
  function playSuccess() { successAudio.currentTime = 0; successAudio.play(); }
  function playError() { errorAudio.currentTime = 0; errorAudio.play(); }

  function showMessage(message, type = 'info') {
    const el = document.getElementById('messageText');
    if (!el) return;
    el.textContent = message;
    el.className = 'block mt-4 text-lg';
    if (type === 'error') {
      el.classList.add('text-red-600');
      playError();
    } else if (type === 'success') {
      el.classList.add('text-green-600');
      playSuccess();
    } else {
      el.classList.add('text-gray-800');
    }
  }

  // 언어 변경 함수 및 이벤트
  function setLang(lang) {
    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.querySelector('.lang-btn[data-lang="' + lang + '"]');
    if (activeBtn) activeBtn.classList.add('active');
    // Only update home button
    var homeBtn = document.querySelector('.home-btn[data-i18n="home_btn"]');
    if (homeBtn && i18n[lang]["home_btn"]) homeBtn.textContent = i18n[lang]["home_btn"];
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (i18n[lang][key]) el.textContent = i18n[lang][key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (i18n[lang][key]) el.placeholder = i18n[lang][key];
    });
    document.documentElement.lang = lang;
    localStorage.setItem('pda_lang', lang);
  }
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.onclick = () => setLang(btn.getAttribute('data-lang'));
  });
  setLang(localStorage.getItem('pda_lang') || 'ko');
}); 

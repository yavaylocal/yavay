/* ================================================
   CARSTING - Interactive Logic & Backend Integration
   ================================================ */

// Supabase Configuration
const SUPABASE_URL = 'https://jhpecshypfmvcoskinls.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_VTUfymVim6EfjnPbIFoktw_q1RAYVpM';
let supabaseClient = null;

function getSupabaseClient() {
  if (supabaseClient) return supabaseClient;
  // The CDN script defines a global `supabase` object with createClient
  if (typeof supabase !== 'undefined' && supabase.createClient) {
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  }
  return supabaseClient;
}

document.addEventListener('DOMContentLoaded', () => {
  // Initialize Supabase client
  getSupabaseClient();

  initHeaderScroll();
  initFadeInObserver();
  initFAQAccordion();
  initFileUpload();
  initFormValidation();
  initSmoothScroll();
  initGalleryScroll();
});

/* ---------- Header Scroll Effect ---------- */
function initHeaderScroll() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (!ticking) {
      requestAnimationFrame(() => {
        header.classList.toggle('scrolled', window.scrollY > 60);
        ticking = false;
      });
      ticking = true;
    }
  });
}

/* ---------- Scroll Fade-In (IntersectionObserver) ---------- */
function initFadeInObserver() {
  const targets = document.querySelectorAll('.fade-in');
  if (!targets.length) return;

  // Fallback: if observer never fires (e.g. file:// protocol quirks), reveal all after 2s
  const fallbackTimer = setTimeout(() => {
    targets.forEach((el) => el.classList.add('is-visible'));
  }, 2000);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        clearTimeout(fallbackTimer);
        const delay = entry.target.dataset.delay || 0;
        setTimeout(() => {
          entry.target.classList.add('is-visible');
        }, delay * 100);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.05,
    rootMargin: '0px 0px 0px 0px'
  });

  targets.forEach((el) => observer.observe(el));
}

/* ---------- FAQ Accordion ---------- */
function initFAQAccordion() {
  const faqList = document.querySelector('.faq-list');
  if (!faqList) return;

  faqList.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq-question');
    if (!btn) return;

    const item = btn.closest('.faq-item');
    if (!item) return;

    const answer = item.querySelector('.faq-answer');
    if (!answer) return;

    const isOpen = item.classList.contains('active');

    // Close all open items
    faqList.querySelectorAll('.faq-item.active').forEach((openItem) => {
      openItem.classList.remove('active');
      const openAnswer = openItem.querySelector('.faq-answer');
      if (openAnswer) openAnswer.style.maxHeight = '0px';
      const openBtn = openItem.querySelector('.faq-question');
      if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
    });

    // Open clicked item if it was closed
    if (!isOpen) {
      item.classList.add('active');
      btn.setAttribute('aria-expanded', 'true');
      answer.style.maxHeight = answer.scrollHeight + 'px';
    }
  });
}

/* ---------- File Upload ---------- */
function initFileUpload() {
  const fileInput = document.getElementById('car-photo');
  const uploadArea = document.querySelector('.file-upload-area');
  const fileNameEl = document.querySelector('.file-name');
  const fileInfoEl = document.querySelector('.file-info');
  const clearBtn = document.getElementById('file-clear-btn');

  if (!fileInput || !uploadArea) return;

  fileInput.addEventListener('change', () => {
    if (fileInput.files.length > 0) {
      const name = fileInput.files[0].name;
      uploadArea.classList.add('has-file');
      if (fileNameEl) fileNameEl.textContent = '✓ ' + name;
      if (fileInfoEl) fileInfoEl.style.display = 'flex';
    } else {
      resetFileUpload();
    }
  });

  if (clearBtn) {
    clearBtn.addEventListener('click', (e) => {
      e.preventDefault();
      resetFileUpload();
    });
  }

  function resetFileUpload() {
    fileInput.value = '';
    uploadArea.classList.remove('has-file');
    if (fileNameEl) fileNameEl.textContent = '';
    if (fileInfoEl) fileInfoEl.style.display = 'none';
  }
}

/* ---------- Image Compression Logic ---------- */
async function compressImage(file, maxWidth = 1200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions if image exceeds maxWidth
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to WebP (quality 0.8)
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(new File([blob], file.name.replace(/\.[^/.]+$/, ".webp"), {
            type: 'image/webp',
            lastModified: Date.now()
          }));
        }, 'image/webp', 0.8);
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
}

/* ---------- Form Validation & Supabase Integration (Owner Form) ---------- */
function initFormValidation() {
  const form = document.getElementById('registration-form');
  if (!form) return;

  const submitBtn = form.querySelector('.header-cta');
  const originalBtnText = submitBtn ? submitBtn.textContent : '送信する';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    let isValid = true;

    // Clear previous errors
    form.querySelectorAll('.form-input').forEach((input) => {
      input.classList.remove('error');
    });
    const uploadArea = form.querySelector('.file-upload-area');
    if (uploadArea) {
      uploadArea.style.borderColor = '';
      uploadArea.style.backgroundColor = '';
    }

    // Validate required fields
    const name = form.querySelector('#owner-name');
    const contact = form.querySelector('#owner-contact');
    const carModel = form.querySelector('#car-model');
    const carGenre = form.querySelector('#car-genre');
    const carColor = form.querySelector('#car-color');
    const customFeatures = form.querySelector('#custom-features');
    const instagramId = form.querySelector('#instagram-id');
    const fileInput = form.querySelector('#car-photo');

    if (name && !name.value.trim()) {
      name.classList.add('error');
      isValid = false;
    }
    if (contact && !contact.value.trim()) {
      contact.classList.add('error');
      isValid = false;
    }
    if (carModel && !carModel.value.trim()) {
      carModel.classList.add('error');
      isValid = false;
    }
    if (carGenre && !carGenre.value.trim()) {
      carGenre.classList.add('error');
      isValid = false;
    }
    if (carColor && !carColor.value.trim()) {
      carColor.classList.add('error');
      isValid = false;
    }
    if (fileInput && fileInput.files.length === 0) {
      if (uploadArea) {
        uploadArea.style.borderColor = 'var(--error)';
        uploadArea.style.backgroundColor = 'rgba(255, 68, 68, 0.05)';
      }
      alert('愛車の写真を1枚アップロードしてください。');
      isValid = false;
    }

    const db = getSupabaseClient();
    if (!isValid || !db) {
      if (!db) console.error('Supabase client not initialized');
      return;
    }

    // UI Loading State
    if (submitBtn) {
      submitBtn.textContent = '送信中...';
      submitBtn.disabled = true;
      submitBtn.style.opacity = '0.7';
      submitBtn.style.cursor = 'not-allowed';
    }

    try {
      let carPhotoUrl = null;

      // 1. Process and upload image if provided
      if (fileInput && fileInput.files.length > 0) {
        const originalFile = fileInput.files[0];
        // Compressing the image before upload
        const compressedFile = await compressImage(originalFile);

        const fileExt = compressedFile.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { data: uploadData, error: uploadError } = await db.storage
          .from('car-images')
          .upload(filePath, compressedFile);

        if (uploadError) throw new Error(`Image upload failed: ${uploadError.message}`);

        // Setup public URL
        const { data: publicUrlData } = db.storage
          .from('car-images')
          .getPublicUrl(filePath);

        carPhotoUrl = publicUrlData.publicUrl;
      }

      // 2. Insert record into database
      const { error: dbError } = await db
        .from('owners')
        .insert([
          {
            name: name.value.trim(),
            contact: contact.value.trim(),
            car_model: carModel.value.trim(),
            car_genre: carGenre ? carGenre.value.trim() : null,
            car_color: carColor ? carColor.value.trim() : null,
            instagram_id: instagramId ? instagramId.value.trim() : null,
            custom_features: customFeatures ? customFeatures.value.trim() : null,
            car_photo_url: carPhotoUrl,
            consent_sns: form.querySelector('#consent-terms') ? form.querySelector('#consent-terms').checked : false
          }
        ]);

      if (dbError) throw new Error(`Database insert failed: ${dbError.message}`);

      // 3. Success UI
      const modal = document.getElementById('success-modal');
      if (modal) {
        modal.classList.add('is-active');
        document.body.style.overflow = 'hidden';
      }
      form.reset();

      // Reset file upload UI
      const uploadArea = document.querySelector('.file-upload-area');
      const fileNameEl = document.querySelector('.file-name');
      const fileInfoEl = document.querySelector('.file-info');
      if (uploadArea) uploadArea.classList.remove('has-file');
      if (fileNameEl) fileNameEl.textContent = '';
      if (fileInfoEl) fileInfoEl.style.display = 'none';

    } catch (error) {
      console.error('Submission error:', error);
      alert(`送信に失敗しました: ${error.message}\nもう一度お試しください。`);
    } finally {
      // Revert UI Loading State
      if (submitBtn) {
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;
        submitBtn.style.opacity = '1';
        submitBtn.style.cursor = 'pointer';
      }
    }
  });

  // Close modal
  const modal = document.getElementById('success-modal');
  if (modal) {
    const closeBtn = modal.querySelector('.modal-close-btn');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        modal.classList.remove('is-active');
        document.body.style.overflow = '';
      });
    }
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('is-active');
        document.body.style.overflow = '';
      }
    });
  }
}

/* ---------- FAQ Accordion ---------- */
function initFaq() {
  const faqItems = document.querySelectorAll('.faq-item');
  if (!faqItems.length) return;

  faqItems.forEach((item) => {
    const question = item.querySelector('.faq-question');
    question.addEventListener('click', () => {
      const isActive = item.classList.contains('active');
      faqItems.forEach((i) => i.classList.remove('active'));
      if (!isActive) item.classList.add('active');
    });
  });
}

/* ---------- Gallery Drag to Scroll ---------- */
function initGalleryScroll() {
  const gallery = document.querySelector('.gallery-grid');
  if (!gallery) return;

  let isDown = false;
  let startX;
  let scrollLeft;

  gallery.addEventListener('mousedown', (e) => {
    isDown = true;
    gallery.style.cursor = 'grabbing';
    startX = e.pageX - gallery.offsetLeft;
    scrollLeft = gallery.scrollLeft;
  });

  gallery.addEventListener('mouseleave', () => {
    isDown = false;
    gallery.style.cursor = 'grab';
  });

  gallery.addEventListener('mouseup', () => {
    isDown = false;
    gallery.style.cursor = 'grab';
  });

  gallery.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - gallery.offsetLeft;
    const walk = (x - startX) * 2;
    gallery.scrollLeft = scrollLeft - walk;
  });

  // Set initial cursor state
  gallery.style.cursor = 'grab';
}

/* ---------- File Upload (Owner Form) ---------- */
function initFileUpload() {
  const fileInput = document.getElementById('car-photo');
  const uploadArea = document.querySelector('.file-upload-area');
  const fileNameEl = document.querySelector('.file-name');
  const fileInfoEl = document.querySelector('.file-info');

  if (!fileInput || !uploadArea || !fileNameEl || !fileInfoEl) return;

  // Handle drag and drop
  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => uploadArea.classList.add('highlight'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    uploadArea.addEventListener(eventName, () => uploadArea.classList.remove('highlight'), false);
  });

  uploadArea.addEventListener('drop', handleDrop, false);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    fileInput.files = files; // Assign dropped files to the input
    handleFiles(files);
  }

  // Handle file selection via input click
  fileInput.addEventListener('change', (e) => {
    handleFiles(e.target.files);
  });

  function handleFiles(files) {
    if (files.length > 0) {
      const file = files[0];
      fileNameEl.textContent = file.name;
      fileInfoEl.style.display = 'block';
      uploadArea.classList.add('has-file');
      uploadArea.style.borderColor = ''; // Reset error styling
      uploadArea.style.backgroundColor = '';
    } else {
      fileNameEl.textContent = '';
      fileInfoEl.style.display = 'none';
      uploadArea.classList.remove('has-file');
    }
  }

  // Initial check if a file is already selected (e.g., after form reset)
  if (fileInput.files.length > 0) {
    handleFiles(fileInput.files);
  }
}

/* ---------- Smooth Scroll ---------- */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const headerOffset = 60;
        const elementPosition = target.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.scrollY - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        });
      }
    });
  });
}

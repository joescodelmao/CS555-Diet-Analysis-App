document.querySelector('input[name="mealImage"]').addEventListener('change', function (e) {
    const file = e.target.files[0];
    if (file) {
      const preview = document.createElement('img');
      preview.src = URL.createObjectURL(file);
      preview.style.maxWidth = '300px';
      document.body.appendChild(preview);
    }
  });
  
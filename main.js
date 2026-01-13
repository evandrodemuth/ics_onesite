document.addEventListener('DOMContentLoaded', () => {
    // Header shadow and padding on scroll
    const header = document.getElementById('header');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Mobile Menu Toggle
    const menuToggle = document.getElementById('mobile-menu');
    const navLinks = document.querySelector('.nav-links');

    menuToggle.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        menuToggle.querySelector('i').classList.toggle('fa-bars');
        menuToggle.querySelector('i').classList.toggle('fa-times');
    });

    // Cinematic Carousel Logic
    const carouselInner = document.querySelector('.carousel-inner');
    const items = document.querySelectorAll('.carousel-item');
    const dots = document.querySelectorAll('.dot');
    let currentIndex = 0;
    let autoPlayInterval;

    if (carouselInner && items.length > 0) {
        console.log('Carousel initialized with', items.length, 'items');

        function updateCarousel(index) {
            currentIndex = index;
            carouselInner.style.transform = `translateX(-${currentIndex * 100}%)`;

            // Update dots
            dots.forEach((dot, i) => {
                dot.classList.toggle('active', i === currentIndex);
            });

            // Update items active class (for opacity transitions if needed)
            items.forEach((item, i) => {
                item.classList.toggle('active', i === currentIndex);
            });
        }

        function startAutoPlay() {
            autoPlayInterval = setInterval(() => {
                let nextIndex = (currentIndex + 1) % items.length;
                updateCarousel(nextIndex);
            }, 6000);
        }

        function stopAutoPlay() {
            clearInterval(autoPlayInterval);
        }

        dots.forEach((dot, index) => {
            dot.addEventListener('click', () => {
                console.log('Dot clicked:', index);
                updateCarousel(index);
                stopAutoPlay();
                startAutoPlay();
            });
        });

        startAutoPlay();
    } else {
        console.error('Carousel elements not found or no items present');
    }

    // Smooth scroll for nav links with offset
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            e.preventDefault();
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                const headerOffset = 80;
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });

                // Close mobile menu if open
                if (window.innerWidth <= 768) {
                    // Logic to hide menu here if implemented
                }
            }
        });
    });

    // Intersection Observer for subtle reveal effects
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, { threshold: 0.1 });

    const visionSubtitle = document.querySelector('.vision-subtitle');
    if (visionSubtitle) {
        visionSubtitle.classList.add('reveal');
        revealObserver.observe(visionSubtitle);
    }

    // Dynamic YouTube Video Loader
    async function loadLatestVideo() {
        const channelId = 'UCw1YJ6NQVKK3ZhKxapXbv2g';
        const proxyUrl = 'https://api.allorigins.win/get?url=';
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;
        const ytPlayer = document.getElementById('yt-player');

        if (!ytPlayer) return;

        try {
            const response = await fetch(`${proxyUrl}${encodeURIComponent(rssUrl)}`);
            const data = await response.json();
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(data.contents, "text/xml");

            // Get the first entry (latest video)
            const entries = xmlDoc.getElementsByTagName('entry');
            if (entries.length > 0) {
                const videoId = entries[0].getElementsByTagName('yt:videoId')[0].textContent;
                console.log('Latest Video ID found:', videoId);
                ytPlayer.src = `https://www.youtube.com/embed/${videoId}`;
            }
        } catch (error) {
            console.error('Error fetching latest video:', error);
            // Fallback is already set in HTML
        }
    }

    loadLatestVideo();
});

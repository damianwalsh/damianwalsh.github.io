var $ = jQuery;
var site = {

  init: function() {
    site.addListeners();
    site.scrollNav();
    site.wayPoints();
    site.skrollr();
    site.smoothScroll();
    site.reSrc();
  },

  addListeners: function() {
    $('.toggle').click(function(){
      var el = $(this).data('target');
      $(this).toggleClass('active');
      $(el).toggleClass('active');
    });
  },

  scrollNav: function() {
    // Hide Header on scroll down
    var didScroll;
    var lastScrollTop = 0;
    var delta = 5;
    var navbarHeight = $('#site-banner').outerHeight();

    $(window).scroll(function(event){
      didScroll = true;
    });

    setInterval(function() {
      if (didScroll) {
          hasScrolled();
          didScroll = false;
      }
    }, 250);

    function hasScrolled() {
      var st = $(this).scrollTop();

      // Make sure they scroll more than delta
      if(Math.abs(lastScrollTop - st) <= delta)
        return;

      if (st > lastScrollTop && st > navbarHeight){
        // Scroll Down
        $('.site-banner').removeClass('is-revealed').addClass('is-hidden');
      } else {
        // Scroll Up
        if(st + $(window).height() < $(document).height()) {
          $('.site-banner').removeClass('is-hidden').addClass('is-revealed');
        }
      }

      lastScrollTop = st;
    }
  },

  wayPoints: function() {
    $('.page-header').waypoint({
      handler: function(direction) {
        $('.site-banner').toggleClass('opaque');
      },
      offset: function() {
        return -$(this.element).outerHeight();
      }
    })
    $('.animated').waypoint(function(direction) {
      $(this.element).toggleClass($(this.element).data('animated'));
    }, { offset: '100%' });
  },

  skrollr: function() {
    if (!Modernizr.touch) {
      var s = skrollr.init({
         forceHeight: false
      });
    }
  },

  smoothScroll: function() {
    $('a[href*=#]:not([href=#])').click(function() {
      if (location.pathname.replace(/^\//,'') == this.pathname.replace(/^\//,'#') || location.hostname == this.hostname) {
        var target = $(this.hash);
        target = target.length ? target : $('[name=' + this.hash.slice(1) +']');
        if (target.length) {
          var hash = this.hash;
          $('html,body').animate({ scrollTop: target.offset().top + 22 }, 500, function() {
            location.hash = hash;
          });
          return false;
        }
      }
    });
  },

  reSrc: function() {
    resrc.ready(function () {
      resrc.configure({
        server : "trial.resrc.it"
      });
      $('.resrc').review({
        callback : function () {
          resrc.run(this);
        }
      });
    });
  }

};

$(document).ready(site.init);



var CreateRoutes = function(map){
  var routes = {};
  var current_location = null;

  function route(path, controller, eventHook=null) {
    routes[path] = {};
    routes[path].controller = controller;
    routes[path].eventHook = eventHook;
  }

  route('/map',
    function() {
      hideDetailPannel();
      hideModal();
  });

  route('/overview',
    function() {
      displayDetailPannel();
      resetLocationStyle();
      map.fitBounds(options.projectExtent);
  });

  route('/',
    function() {
      displayDetailPannel();
      resetLocationStyle();
      map.fitBounds(options.projectExtent);
  });


  // *** SPATIAL RECORDS ***
  route('/records/location',
    function() {
      displayDetailPannel();

      if (current_location && current_location.url !== window.location.hash) {
        current_location.url = window.location.hash;
        console.log(current_location);
        centerOnLocation(current_location.bounds);
      }
  });

  route('/records/location/new',
    function() {
      displayEditDetailPannel();
      // ADD: map editing features
  });

  route('/records/location/edit', 
    function() {
      displayEditDetailPannel();
      if (current_location) {
        centerOnLocation(current_location.bounds);
      }
    },
    function(path){
      formSubmission(path, '/edit/', 'location-wizard');
  });

  route('/records/location/delete',
    function() {
      return displayModal();
    },
    function(path){
      formSubmission(path, '/delete/', 'modal-form');
  });

  route('/records/location/resources',
    function() {
      displayDetailPannel();

      var current_url = window.location.hash.remove('/resources')
      console.log(current_url)
      if (current_location && current_location.url !== current_url) {
        current_location.url = current_url;
        console.log(current_location);
        centerOnLocation(current_location.bounds);
      }
  });

  route('/records/location/resources/add',
    function() {
      console.log('resources/add')
      return displayModal();
    }, 
    function(path) {
      formSubmission(path, '/resources/add/', 'modal-form');
  });

  route('/records/location/resources/new', 
    function() {
      return displayModal();
    }, 
    function(path) {
      original_file = $('input[name="original_file"]').val();

      if (original_file) {
        $('a.file-link').text(original_file);
        $('a.file-link').attr('download', original_file);
      }

      $('.file-input').change(function(event) {
        var file = event.target.files[0];

        $('a.file-link').on('link:update', function() {
            console.log('.file-link changed!')
            $('a.file-link').text(file.name);
            $('a.file-link').attr('download', file.name);
        });

        $('input[name="original_file"]').val(file.name);
        console.log('original_file:', $('input[name="original_file"]').val())
        // $('input[name="details-original_file"]').val(file.name);

        var ext = file.name.split('.').slice(-1)[0];
        var type = file.type || MIME_LOOKUPS[ext];
        $('input[name="mime_type"]').val(type);
        console.log('mime_type:', $('input[name="mime_type"]').val())
      });

      $('a.file-remove').click(function() {
        $('.file-well .errorlist').addClass('hidden');
        $(this).parents('.form-group').removeClass('has-error');
      });

      formSubmission(path, '/resources/new/', 'modal-form');
  });

  route('/records/location/relationships',
    function() {
      displayDetailPannel();

      var current_url = window.location.hash.remove('/relationships')
      console.log(current_url)
      if (current_location && current_location.url !== current_url) {
        current_location.url = current_url;
        console.log(current_location);
        centerOnLocation(current_location.bounds);
      }
  });

  route('/records/location/relationships/new',
    function() {
      return displayModal();

    }, function(path) {
      var template = function(party) {
        if (!party.id) {
          return party.text;
        }
        return $(
          '<div class="party-option">' +
          '<strong class="party-name">' + party.text + '</strong>' +
          '<span class="party-type">' + party.element.dataset.type + '</span>' +
          '</div>'
        );
      };
      $("#party-select").select2({
        minimumResultsForSearch: 6,
        templateResult: template,
        theme: "bootstrap",
      });

      $('.datepicker').datepicker({
        yearRange: "c-200:c+200",
        changeMonth: true,
        changeYear: true,
      });

      // /* eslint-env jquery */
      $('#add-party').click(function(){
        $('#select-party').toggleClass('hidden');
        $('#new-item').toggleClass('hidden');
      });

      $('button#add-party').click(function() {
        $('#new_entity_field').val('on');
      });

      $('table#select-list tr').click(function(event) {
        const target = $(event.target).closest('tr');
        const relId = target.attr('data-id');
        target.closest('tbody').find('tr.info').removeClass('info');
        target.addClass('info');
        $('input[name="id"]').val(relId);
      });

      formSubmission(path, '/relationships/new/', 'modal-form');
    });


  // *** RELATIONSHIPS ***
  route('/records/relationship',
    function() {
      displayDetailPannel();
  });

  route('/records/relationship/edit',
    function() {
      displayEditDetailPannel();
    }, function(path){
      formSubmission(path, '/edit/', 'detail-form');
  });

  route('/records/relationship/delete',
    function() {
      return displayModal();
    },
    function(path){
      formSubmission(path, '/delete/', 'modal-form', current_location.url);
  });

  route('/records/relationship/resources/add',
    function() {
      return displayModal();
    }, function(path) {
      'use strict';
      formSubmission(path, '/resources/add/', 'modal-form');
  });

  route('/records/relationship/resources/new',
    function() {
      return displayModal();
    }, function(path) {
      formSubmission(path, '/resources/new/', 'modal-form');
  });

  function resizeMap() {
    window.setTimeout(function() {
        map.invalidateSize();
      }, 400);
  }

  function displayDetailPannel() {
    hideModal();
    if ($('.content-single').hasClass('detail-hidden')) {
      $('.content-single').removeClass('detail-hidden');
      resizeMap();
    }

    if ($('#project-detail').hasClass('detail-edit')) {
      $('#project-detail').removeClass('detail-edit');
    }
  }

  function displayEditDetailPannel() {
    hideModal();
    if ($('.content-single').hasClass('detail-hidden')) {
      $('.content-single').removeClass('detail-hidden');
      resizeMap();
    }

    if (!$('#project-detail').hasClass('detail-edit')) {
      $('#project-detail').addClass('detail-edit');
    }
  }

  function hideDetailPannel() {
    hideModal();
    if (!$('.content-single').hasClass('detail-hidden')) {
      $('.content-single').addClass('detail-hidden');
      resizeMap();
    }
  }

  function displayModal() {
    if (!$("#additional_modals").is(':visible')) {
      $("#additional_modals").modal('show');
    }

    return document.getElementById("additional_modals")
  }

  function hideModal() {
    if ($("#additional_modals").is(':visible')) {
      $("#additional_modals").modal('hide');
    }
  }

  function centerOnLocation(location) {
    var bounds;
    if (typeof(location.getBounds) === 'function'){
      bounds = location.getBounds();
    } else {
      // If the spatial unit is a marker
      var latLngs = [location.getLatLng()];
      bounds = L.latLngBounds(latLngs);
    }

    if (bounds.isValid()){
      map.fitBounds(bounds);
    }

    if (location.setStyle) {
      location.setStyle({color: '#edaa00', fillColor: '#edaa00', weight: 3})
    }
  }

  function setCurrentLocation () {
    map.on("popupopen", function(evt){
      currentPopup = evt.popup;

      $('#spatial-pop-up').click(function(e){
        resetLocationStyle();
        current_location = {
          bounds: currentPopup._source,
        }
        map.closePopup();
      });
    });
  }

  setCurrentLocation();

  function resetLocationStyle() {
    if ((current_location) && current_location.bounds.setStyle) {
      current_location.bounds.setStyle({color: '#3388ff', fillColor: '#3388ff', weight: 2})  
    }
  }

  function formSubmission(path, hash_path, form, success_url=null){
    var form = $('#' + form);

    form.submit(function(e){
      e.preventDefault();
      var data = $(this).serializeArray().reduce(function(obj, item) {
          obj[item.name] = item.value;
          return obj;
      }, {});

      $.ajax({
        method: "POST",
        url: path,
        data: data
      }).done(function(response, status, xhr) {
        if (!response.includes('DOCTYPE')) {
          if (form === $('#modal-form')) {
            document.getElementById("additional_modals").innerHTML = response;
          } else {
            document.getElementById("project-detail").innerHTML = response;
          }
        } else {
          console.log("INTERCEPTED!")
          if (hash_path === '/delete/') {
            window.location.hash = success_url;
          } else {
            var new_hash = this.url.replace(hash_path, '').split('records');
            new_hash = new_hash.length > 1 ? new_hash[1] : new_hash[0]
            window.location.hash = '#/records' + new_hash
          }
        }
      });
    });
  }

  return routes;
}
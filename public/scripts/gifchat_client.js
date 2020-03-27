// AJAX to get and display user information. This was mainly for testing purposes.
// $(document).ready(function () {
//   $("#retrieveUserInfo").click(function () {
//     let user = { userId: $("#userId").val()};
//     $.post("/retrieveuser", user, function(data, status) {
//       let user = data[0];
//       $("#userinfo").html("<p>User info: " + JSON.stringify(user) + "</p>");
//     });
//   });
// });

// Message constructor. This is the main data type we will pass back and forth to the server
//  text - the text of the message being posted (note: we need to )
//  gifUrl - the url of a gif to include in the message. This is optional.
var timeout;  // global timeout variable, used to cancel and restart message update loop

function Message(text, gifUrl) {
  this.text = text;
  this.gifUrl = gifUrl;
}

// AJAX to get and display GIFs
$(document).ready(function () {
  $("#searchGiphy").click(function () {
    let search = { searchPhrase: $("#searchPhrase").val() };
    $.post("/gifsearch", search, function (data, status) {
      let gifs = data.data; // the data object has...data
      let gifList = $(document.createElement('ul'));
      gifs.forEach(element => {
        let li = $(document.createElement('li'));
        let v = $(document.createElement('video'));
        v.attr({
          autoplay: '',
          loop: '',
          class: 'clickableGif', 
          id: element.images.original.mp4
        });
        v.append(
          $('<source>').attr({
            src: element.images.fixed_width.mp4,
            type: 'video/mp4'
          })
        );
        // v.html('<source src="' + element.images.fixed_width.mp4 + '" type="video/mp4">');
        li.html(v);
        gifList.append(li);
      });
      $("#gifResults").html(gifList);
      $(".clickableGif").click(postGif);    // this is what makes it possible for a gif to be posted. 
    });
  });

});

// Function to click button when enter is pressed in the Search GIPHY area
$(document).ready(function () {
  $("#searchPhrase").keyup(function(e) {
    if (e.keyCode === 13) {
      $("#searchGiphy").click();
    }
  });
});

// place gif Url into the text field designated for it
function postGif(event) {
  $("#gifUrl").val(event.currentTarget.id);
}


// let amessage = new Message("tobit", "Hello, and welcome to my chat room");
// amessage.newprop = "this is a new property";

// $.post("/postmessage", amessage, function (data, status) {
//   let anothermessage = data;
//   console.log(anothermessage);
//   console.log(!!anothermessage.gifId)
//   // $("#userinfo").html("<p>User info: " + JSON.stringify(user) + "</p>");
// });


// $(document).ready(function() {
//   $("#classout").html(JSON.stringify(amessage));
// })

// create message and post to server.
$(document).ready(function() {
  $("#postMessage").click(function() {
    // make the message
    let newMessage = new Message($("#message").val(), $("#gifUrl").val());
    $.post({
      url: '/postmessage', 
      data: newMessage, 
      statusCode: {
        401: function() {
          toggleHideShow($("#messagenotpostedalert"));
          setTimeout(toggleHideShow, 2000, $("#messagenotpostedalert"));
        },
        200: function(data) {
          console.log(data);
          $("#message").val('');
          $("#gifUrl").val('');

          // interrupt the setTimeout loop and start it over, so we don't have to wait to see our message we just posted
          clearTimeout(timeout);
          doAjax();
        }
      }
    });
  });
});

// Function to retrieve chats from server. This keeps calling over and over every few seconds to update the 
//  chat area. 
var interval = 3000;  // 3 seconds
var clientMessageId = 0;  // the last message we received. Start at message zero. 
function doAjax() {
  let clientMessageIdObject = {clientMessageId: clientMessageId};
  $.post({
    url: '/getmessages',
    data: clientMessageIdObject,
    success: function (data) {
      data.forEach(element => {
        let p = createHtmlMessage(element);
        $('#chatArea').prepend(p);
        clientMessageId = element.messageId;
      });
    },
    complete: function () {
      timeout = setTimeout(doAjax, interval);
    }
  });
}
doAjax();   // kick off the loop

// function to create an HTML <p> from a message
function createHtmlMessage(message) {
  let p = $(document.createElement('p'));
  p.append('<strong>' + message.username + '</strong>: ' + message.text);

  // if there is a gifUrl, include that too
  if (!!message.gifUrl) {
    let v = $(document.createElement('video'));
    v.attr('autoplay', '');
    v.attr('loop', '');
    v.append(
      $('<source>').attr({
        src: message.gifUrl,
        type: 'video/mp4'
      })
    );
    p.append('<br>'); // make sure we get a new line
    p.append(v);
  }

  return p;
}


// Function to click button when ctrl+enter is pressed in the Message area
$(document).ready(function () {
  $("#messagediv").keyup(function (e) {
    if ((e.ctrlKey || e.metaKey) && (e.keyCode == 13 || e.keyCode == 10)) {
      $("#postMessage").click();
    }
  });
});

// toggle hide/show classes for bootstrap alert 
function toggleHideShow(jqelement) {
  jqelement.toggleClass("show").toggleClass("hide");
}
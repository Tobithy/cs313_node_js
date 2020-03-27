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

// Function to click button when enter is pressed in the login area
$(document).ready(function () {
  $("#login_area").keyup(function (e) {
    if (e.keyCode === 13) {
      $("#login").click();
    }
  });
});

// login using ajax
$(document).ready(function() {
  $("#login").click(function() {
    // make the login info
    let user = {username: $("#username").val(), password: $("#password").val()}
    $.post({
      url: '/login', 
      data: user, 
      statusCode: {
        401: function() {
          toggleHideShow($("#loginFailure"));
          setTimeout(toggleHideShow, 2000, $("#loginFailure"));
        },
        200: function(data) {
          window.location.href = "/gifchat";
        }
      }
    });
  });
});

// toggle hide/show classes for bootstrap alert 
function toggleHideShow(jqelement) {
  jqelement.toggleClass("show").toggleClass("hide");
}
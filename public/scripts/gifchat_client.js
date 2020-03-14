// AJAX to get and display user information
$(document).ready(function () {
  $("#retrieveUserInfo").click(function () {
    let user = { userId: $("#userId").val()};
    $.post("/retrieveuser", user, function(data, status) {
      let user = data[0];
      $("#userinfo").html("<p>User info: " + JSON.stringify(user) + "</p>");
    });
  });

});

// AJAX to get and display GIFs
$(document).ready(function () {
  $("#searchGiphy").click(function () {
    let search = { searchPhrase: $("#searchPhrase").val() };
    $.post("/gifsearch", search, function (data, status) {
      let gifs = data.data; // the data object has...data
      let gifhtml = '';
      gifs.forEach(element => {
        gifhtml += '<video autoplay loop><source src="' + element.images.fixed_width.mp4 + '" type="video/mp4"></video><br><br>';
      });
      $("#gifResults").html(gifhtml);
    });
  });

});
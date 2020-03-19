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
      let gifList = $(document.createElement('ul'));
      gifs.forEach(element => {
        let li = $(document.createElement('li'));
        let v = $(document.createElement('video'));
        v.attr('autoplay', '');
        v.attr('loop', '');
        v.html('<source src="' + element.images.fixed_width.mp4 + '" type="video/mp4">');
        li.html(v);
        gifList.append(li);
      });
      $("#gifResults").html(gifList);
    });
  });

});

// place gif into chatarea
function postGif(url) {
  let v = $(document.createElement('video'));
  v.setAttribute('autoplay', '');
  v.setAttribute('loop', '');
  v.html('<source src="' + url + '" type="video/mp4">');
  $("#chatArea").html = v;
}
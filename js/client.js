$(function() {
  $('.point-button').click(function() {
    var $this = $(this);
    if ($this.is('.selected')) {
      return;
    }
    
    $('.point-button.selected').removeClass('selected');
    $this.addClass('selected');
  });
});
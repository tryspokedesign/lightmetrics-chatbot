$(document).ready(function () {
  // Close chatbot
  $(".chatbot_header-close-icon").on("click", function () {
    $(".chatbot_modal-wrapper").fadeTo(400, 0, function () {
      $(this).css("display", "none");
    });

    // Enable body scroll
    $(".body").css("overflow", "");
  });

  // Open chatbot
  $(".chatbot_button").on("click", function () {
    $(".chatbot_modal-wrapper").css("display", "block").hide().fadeTo(400, 1);
    
    // Disable body scroll
    $(".body").css("overflow", "hidden");
  });

  // Expand or shrink chatbot
  $(".chatbot_header-scale-icon").on("click", function () {
    const $modal = $(".chatbot_modal-wrapper");
    const expanded = $modal.hasClass("expand-box");

    if (expanded) {
      $modal.removeClass("expand-box").css("max-width", "");
    } else {
      $modal.addClass("expand-box").css("max-width", "100%");
    }
  });

  // Input Height increase based on text
  autosize();
  function autosize() {
    var text = $(".chatbot_question-input");

    text.each(function () {
      $(this).attr("rows", 1);
      resize($(this));
    });

    text.on("input", function () {
      resize($(this));
    });

    function resize($text) {
      $text.css("height", "auto");
      $text.css("height", $text[0].scrollHeight + "px");
    }
  }

  // When the input changes in the specified field
  $(".chatbot_question-input").on("input", function () {
    // Get the current length of the text in this input field
    const currentLength = $(this).val().length;

    // Update the text of the counter display element
    $(".chatbot_input-character-count").text(currentLength);
  });

  // When the user presses enter in the input field, Ask the question
  $("#Write-Input").on("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      $(".chatbot_question-submit").click();
      $(this).blur();
    }
  });

  // Show and Hide the Action buttons when hover in and out of content
  
  // ---------------- HOVER ACTIONS (Per Block) ----------------
    $(document).on("mouseenter", ".chatbot_topic-answer-content", function () {
      const block = $(this);
      const actionWrapper = block.find(".chatbot_modal-actions-wrapper");
      
      actionWrapper.stop(true, true).css("display", "flex").fadeTo(200, 1);
    });
    
    $(document).on("mouseleave", ".chatbot_topic-answer-content", function () {
      const block = $(this);
      const actionWrapper = block.find(".chatbot_modal-actions-wrapper");
      
      actionWrapper.stop(true, true).fadeTo(200, 0, function () {
        $(this).css("display", "none");
      });
    });

  // // ---------------- DISLIKE BUTTON (Per Block) ----------------
  $(document).on("click", ".chatbot_modal-action-dislike", function () {
    const dislikeButton = $(this);

    // Find the specific answer block
    const block = dislikeButton.closest(".chatbot_topic-answer-content");

    // Find elements inside this block only
    const formWrapper = block.find(".chatbot-action-form-wrapper");
    const likeButton = block.find(".chatbot_modal-action-like");

    // Reset like
    likeButton.find(".selected-like-icon").hide();
    likeButton.find(".default-like-icon").show();

    // Toggle form inside this block
    formWrapper.fadeToggle(200);

    // Toggle dislike icons only inside this block
    const selected = dislikeButton.find(".selected-dislike-icon");
    const normal = dislikeButton.find(".default-dislike-icon");

    if (selected.is(":visible")) {
      selected.hide();
      normal.show();
    } else {
      selected.show();
      normal.hide();
    }
  });

  // ---------------- CLOSE FORM ----------------
  $(document).on("click", ".chatbot_action-form-close", function () {
    const closeBtn = $(this);

    // Get specific block
    const block = closeBtn.closest(".chatbot_topic-answer-content");

    const formWrapper = block.find(".chatbot-action-form-wrapper");
    const dislikeButton = block.find(".chatbot_modal-action-dislike");

    // Close form only in this block
    formWrapper.fadeOut(200);

    // Reset dislike icons only in this block
    dislikeButton.find(".selected-dislike-icon").hide();
    dislikeButton.find(".default-dislike-icon").show();
  });
});
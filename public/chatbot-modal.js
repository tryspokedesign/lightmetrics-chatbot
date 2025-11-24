console.log("test");
$(document).ready(function () {
  // Close chatbot
  $(".chatbot_header-close-icon").on("click", function () {
    $(".chatbot_modal-wrapper").fadeTo(400, 0, function () {
      $(this).css("display", "none");
    });

    // Enable body scroll
    $("body").css("overflow", "");
  });

  // Open chatbot
  $(".chatbot_button").on("click", function () {
    $(".chatbot_modal-wrapper").css("display", "block").hide().fadeTo(400, 1);
    
    // Disable body scroll
    $("body").css("overflow", "hidden");
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

  // Close chatbot feedback form
  // $(".chatbot_action-form-close").on("click", function () {
  //   $(".chatbot-action-form-wrapper").fadeTo(400, 0, function () {
  //     $(this).css("display", "none");
  //   });
  // });

  // Show and Hide the Action buttons when hover in and out of content

  // ---------------- HOVER ACTIONS (Per Block) ----------------
  // if($(window).width() <= 991){
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
  // }

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

  // ---------------- CLOSE FORM (Per Block) ----------------
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

// const upstreamResponse = await fetch(
//   "https://reseller-api-dev.lightmetrics.co/v1/llm-kb/health-check",
//   {
//     method: "GET",
//     headers: {
//       Authorization: `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjZmNjU3ZGRiYWJmYmZkOTVhNGVkNjZjMjMyNDExZWFhNjE5OGQ4NGMxYmJkOGEyYTI5M2I4MTVmYjRhOTlhYjEifQ.eyJpZCI6Im1lbV9zYl9jbWV3aHJvcTcwMDE0MHd2YWhrcW00d2J6IiwidHlwZSI6Im1lbWJlciIsImlhdCI6MTc2MjkzODAwNiwiZXhwIjoxNzk0MDQyMDA2LCJhdWQiOiJhcHBfY2x6Mmt4dHB5MDA3ejB0cnA2aGNoM3g0eCIsImlzcyI6Imh0dHBzOi8vYXBpLm1lbWJlcnN0YWNrLmNvbSJ9.J1O4dBGRZyoJfCO1vxAqVTKlRWbUjtVQwcmzlpoOALifXDycfvZzsZlcyizJ8WHXNLA0GGyUvgv1hHXRxNGjZnE-g-4hr7yg1LLgMMPoXbJhzA9klwXQGNPB8aOwVoUXYUH_QPPLRMGTRnCWr9LUX7n5qFJsxkp-62_62eXA6QtwaoNVHOEU3MnD1D-NEqFEiSGknOt4AKWFrzTEg-wrbOtk4_DOut9Q9KAIjZ9gTN81SOJr8RaSgu29yQNdVBQnFWLbkKKpPTMhYcDqUjtUK5xgZpQ5ELqI9dCduqztWB9o7_w94lBeljvp8HyKWBYhUqR_gd6dHR4ntjD8gDUiaA`,
//       //  "AWSALBAuthNonce=okt2e445GMpRJB8d; AWSELBAuthSessionCookie-0=UhGFE/nA2P2AjXgn+5YyVo2dkOUvLR1oAX0FWqVG8jwVYvvrH3fdjWgHCi2bXEmqPUodyerVp1iQiA0KZJgmny0zI2c5mg7F/WPDQBlUO7T5EJFOKSHNGcrXgszuNVUONR1JeplhavVg+1IQ9dpbV8eJdei0zfpweX0urbDSx88SJQSecS6aFx9NEhEYmCruYZRjti0zSwDrqr4cJfQP8pycEm474d6dtRGJK2YpovE7empf+L2SnBMZdnYTO3qD5PIK/N+d4zhLieADPb/j7s5lN9763QbiZBuyss3JzI7psOHRu1yJBnfZlyXvCj8zV19xtMbmG9yviHkD0pOxk1f9mB+fanLfjivLXMWc0mTmGg0vR/CkqFoJabql02GGhS/8D/uw7b+EGmT/OEESJu1O8Fw3soPKtCY4MDRMbnzEFIx44TdhLuQXFdEhtPg7qHHgCH/Un3VZjSy+DzaVqiv5N3ejnPynU7vvcEO7t43tdjCmEoNIO8mz2r15kO9nbWj8GZJAyEzWI+aSrtML6S1jjfc6NqiC88GBUDeYOPFL2baL/BHLtQ==",
//     },
//   }
// );

// console.log("New Api Called");

// (async function () {
//   try {
//     const upstreamResponse = await fetch(
//       "https://reseller-api-dev.lightmetrics.co/v1/llm-kb/all-categories",
//       {
//         method: "GET",
//         headers: {
//           Authorization: `Bearer eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6IjZmNjU3ZGRiYWJmYmZkOTVhNGVkNjZjMjMyNDExZWFhNjE5OGQ4NGMxYmJkOGEyYTI5M2I4MTVmYjRhOTlhYjEifQ.eyJpZCI6Im1lbV9zYl9jbWV3aHJvcTcwMDE0MHd2YWhrcW00d2J6IiwidHlwZSI6Im1lbWJlciIsImlhdCI6MTc2MjkzODAwNiwiZXhwIjoxNzk0MDQyMDA2LCJhdWQiOiJhcHBfY2x6Mmt4dHB5MDA3ejB0cnA2aGNoM3g0eCIsImlzcyI6Imh0dHBzOi8vYXBpLm1lbWJlcnN0YWNrLmNvbSJ9.J1O4dBGRZyoJfCO1vxAqVTKlRWbUjtVQwcmzlpoOALifXDycfvZzsZlcyizJ8WHXNLA0GGyUvgv1hHXRxNGjZnE-g-4hr7yg1LLgMMPoXbJhzA9klwXQGNPB8aOwVoUXYUH_QPPLRMGTRnCWr9LUX7n5qFJsxkp-62_62eXA6QtwaoNVHOEU3MnD1D-NEqFEiSGknOt4AKWFrzTEg-wrbOtk4_DOut9Q9KAIjZ9gTN81SOJr8RaSgu29yQNdVBQnFWLbkKKpPTMhYcDqUjtUK5xgZpQ5ELqI9dCduqztWB9o7_w94lBeljvp8HyKWBYhUqR_gd6dHR4ntjD8gDUiaA`,
//         },
//       }
//     );
//     const data = await upstreamResponse.json();
//     console.log("data", data);
//   } catch (e) {
//     console.error(e);
//   }
// })();

/*
Copyright 2024 Timothy Xiang

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
documentation files (the “Software”), to deal in the Software without restriction, including without limitation the
rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
persons to whom the Software is furnished to do so, subject to the following conditions:

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

// ==UserScript==
// @name         Github PR Hide Comments
// @namespace    https://github.com/txiang2
// @version      1.0
// @description  Add a selector to optionally hide github timeline comments from selected users.
// @author       txiang2
// @match        https://github.com/*/pull/*
// @require      https://code.jquery.com/jquery-3.7.1.min.js
// ==/UserScript==

"use strict";

// abusing the global scope to store states
var discussion = $('<placeholder/>');
var selections = new Map();
var userComments = new Map();
var hideUserDiscussionSelector = $('<placeholder/>');

var hideUserAnchorText = $(
    '<div class="anchor-text">Hide users</div>'
).css(
    'position', 'relative'
).css(
    'top', '-1.25rem'
).css(
    'left', '1rem'
);

function updateDiscussion() {
    var sellectedPullRequestTab = $(
        $(".application-main").find("div[class*='tabnav']")[0]
    ).find("a[class*='selected']")[0];
    var inConversation = sellectedPullRequestTab.text.includes("Conversation");
    if (!inConversation) return;
    discussion = $("div[class*='js-discussion js-socket-channel']");
}

function initializeSelection() {
    userComments = new Map();
    discussion.children().each((i, element) => {
        var elementJQ = $(element)
        var avatarImages = elementJQ.find("img[class*='avatar']");
        if (avatarImages.length > 0) {
            var user = avatarImages[0].alt
            if (!userComments.has(user)) {
                userComments.set(user, [])
            }
            userComments.get(user).push(elementJQ)
        }
    });
    var currentSelections = new Map();
    userComments.forEach((elements, user) => {
        if (selections.has(user)) {
            currentSelections.set(user, selections.get(user))
        } else {
            currentSelections.set(user, false);
        };
    });
    selections = new Map([...currentSelections.entries()].sort());
}

function hideUserComments(user) {
    userComments.get(user).forEach((element) => {
        element.attr("hidden", selections.get(user));
    });
}

function renderHideUserDiscussionSelector() {
    $("div[class*='hide-user-discussion-selector']").remove()

    hideUserDiscussionSelector = $(
        '<div />',
        {
            id: 'hide-user-discussion-selector',
        }
    ).css(
        'padding-left', '0.5rem'
    );

    var hideUserAnchorIndicator = $(
        '<div class="anchor-indicator">+</div>:'
    ).css(
        'position', 'relative'
    ).css(
        'top', '0rem'
    );

    var hideUserAnchor = $(
        '<div class="anchor" />'
    ).css(
        'font-weight', 'bold'
    ).css(
        'user-select', 'none'
    ).css(
        'cursor', 'pointer'
    );

    hideUserAnchor.append(hideUserAnchorIndicator);
    hideUserAnchor.append(hideUserAnchorText);

    var hiddenUserOptions = $(
        '<div class="hide-user-options" hidden/>'
    ).css(
        'padding-left', '1.05rem'
    ).css(
        'position', 'relative'
    ).css(
        'top', '-1rem'
    );

    hideUserAnchor.click((event) => {
        var hideOptions = hiddenUserOptions.attr("hidden");
        hideUserAnchorIndicator.text(hideOptions ? '-' : '+');
        hideUserAnchorIndicator.css('top', `${hideOptions ? -0.1 : 0}rem`);
        hiddenUserOptions.attr("hidden", !hideOptions);
    });

    selections.forEach((shouldHide, user) => {
        var userSelection = $(
            `<input type="checkbox" ${shouldHide ? 'checked' : ''} user="${user}"> ${user.replace('@', '')}</input><br/>`
        )
        userSelection.change(() => {
            selections.set(user, $(userSelection).is(':checked'));
            var hideUser = selections.get(user);
            userComments.get(user).forEach((element) => {
                element.attr("hidden", hideUser);
            });
        });
        hiddenUserOptions.append(userSelection);
    });

    hideUserDiscussionSelector.append(hideUserAnchor);
    hideUserDiscussionSelector.append(hiddenUserOptions);
    discussion.prepend(hideUserDiscussionSelector);
}

function hideComments() {
    selections.forEach((shouldHide, user) => {
        var hideUser = selections.get(user);
        userComments.get(user).forEach((element) => {
            element.attr("hidden", hideUser);
        });
    });
}

function renderComments() {
    updateDiscussion();
    initializeSelection();
    renderHideUserDiscussionSelector();
    hideComments();
}

window.addEventListener("turbo:load", (event) => { renderComments(); });

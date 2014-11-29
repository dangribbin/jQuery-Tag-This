/*!
    jQuery Tag This
    Copyright 2014 Dan Gribbin - dangribbin@gmail.com

    Licensed under the MIT license:
    http://www.opensource.org/licenses/mit-license.php

    Hat tip to jQuery Tags Input Plugin by XOXCO, Inc.

*/

(function($) {

    'use strict';

    var wrapper,
    callbacks = [],
    createTagWith = [],
    emailRegex = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    originalInputWidth,
    disallowedDelimeters = [37, 39, 8, 46];

    $.fn.tagThis = function(options) {
        var settings = jQuery.extend({
            interactive : true,
            defaultText : 'type to tag',
            createTagWith : ',',
            hideOriginal : true,
            noDuplicates : false,
            removeWithBackspace : true,
            regex : '',
            maxChars : 0,
            maxTags : 0,
            width : '300px',
            height : '100px'
        },options);

        this.each(function() {

            $(this).data('settings', settings);

            if (settings.hideOriginal) {
                $(this).hide();
            }

            var id = $(this).attr('id');

            if (!id || createTagWith[$(this).attr('id')]) {
                id = $(this).attr('id', 'tags' + new Date().getTime()).attr('id');
            }

            var data = jQuery.extend({
                wrapper: '#tag-this--'+id,
                realInput: '#'+id,
                fakeInput: '#'+id+'--tag'
            },settings);

            createTagWith[id] = data.createTagWith;

            //set up callbacks into an object

            if (settings.callbacks && (settings.callbacks.beforeAddTag || settings.callbacks.afterAddTag || settings.callbacks.onChange || settings.callbacks.afterRemoveTag || settings.callbacks.beforeRemoveTag || settings.callbacks.errors) ) {
                callbacks[id] = [];
                callbacks[id]['beforeAddTag'] = settings.callbacks.beforeAddTag;
                callbacks[id]['afterAddTag'] = settings.callbacks.afterAddTag;
                callbacks[id]['afterRemoveTag'] = settings.callbacks.afterRemoveTag;
                callbacks[id]['onChange'] = settings.callbacks.onChange;
                callbacks[id]['beforeRemoveTag'] = settings.callbacks.beforeRemoveTag;
                callbacks[id]['errors'] = settings.callbacks.errors;
            }

            var html = '<div id="tag-this--' + id + '" class="tag-this"><div id="'+id+'--addTag">';

            if (settings.email){
                $(this).data('type', 'email');
            }

            if (settings.interactive) {
                html = html + '<input id="'+id+'--tag" value="" data-default="'+ settings.defaultText +'" />';
            }

            html = html + '</div><div class="tag-this--clear"></div></div><div class="tag-this--error"></div>';

            $(html).insertAfter(this);

            if (settings.interactive) {

                //fake input is what the user types in (created by the plugin)
                var fakeInputElement = $(data.fakeInput);

                //real input is the input you called tagThis() on.
                var realInputElement = $(data.realInput);

                originalInputWidth = fakeInputElement.css('width');

                fakeInputElement.val(fakeInputElement.attr('data-default'));

                $(data.wrapper).on( 'click', data, function(event) {
                    $(event.data.fakeInput).focus();
                });


                //attach event handlers

                fakeInputElement.on( 'focus', data, function(event) {
                    var fakeInput = $(event.data.fakeInput);
                    if (fakeInput.val()===fakeInput.attr('data-default')) {
                        fakeInput.val('');
                    }
                }).on( 'keyup.arrowKeys', function(e){
                    var parent = $(this).parent();

                    if ( e.which === 37 && $(this).val() === '' ) { //left
                        var tagToSwapWith = parent.prev('.tag');
                        if ( tagToSwapWith ) {
                            parent.after(tagToSwapWith);
                        }
                    }
                    else if ( e.which === 39 && $(this).val() === '' ) { //right
                        var tagToSwapWith = parent.next('.tag');
                        if ( tagToSwapWith ) {
                            parent.before(tagToSwapWith);
                        }
                    }
                    else if ( e.keyCode === 8 && $(this).val() === '' ) {
                        var tagToDelete = parent.prev('.tag');

                        if ( tagToDelete ) {
                            tagToDelete.find('.tag-this--remove-tag').trigger('click');
                        }
                    }
                    else if ( e.keyCode === 46 && $(this).val() === '' ) {
                        var tagToDelete = parent.next('.tag');

                        if ( tagToDelete ) {
                            tagToDelete.find('.tag-this--remove-tag').trigger('click');
                        }
                    }
                });


                //autocomplete functionality

                if (settings.autocompleteSource) {

                    var autocompleteSettings = {
                        source: settings.autocompleteSource,
                        select: function( event, ui ) {
                            event.preventDefault();
                            realInputElement.addTag(ui.item.value);
                            fakeInputElement.focus();
                        }
                    };

                    if (jQuery.ui.autocomplete) {
                        fakeInputElement.autocomplete(autocompleteSettings);
                    }
                    else{
                        throw new Error("jQuery-Tag-This is missing the jQuery UI dependecy needed for autocomplete to work. If you don't need autocomplete, don't set the autocompleteSource setting.");
                    }
                }


                // if a user tabs out of the field, create a new tag
                fakeInputElement.on( 'blur', data, function(event) {
                    var defaultText = $(this).attr('data-default');
                    var fakeInput = $(event.data.fakeInput);
                    var fakeInputVal = fakeInput.val();

                    if (fakeInput.val() !== '' && fakeInput.val() !== defaultText) {
                        $(event.data.realInput).addTag(fakeInputVal);
                    } else {
                        fakeInput.val(fakeInput.attr('data-default'));
                    }
                    return false;
                });


                // if user types a delimeter, create a new tag
                fakeInputElement.on( 'keypress', data, function(event) {

                    var fakeInput = $(event.data.fakeInput);
                    var fakeInputVal = fakeInput.val();

                    $(this).autosizeInput(fakeInput);

                    if ( ( $.inArray(event.which, event.data.createTagWith) && !$.inArray(event.which, disallowedDelimeters) ) ||  event.which === 13 || event.which === 44 ) {
                        event.preventDefault();
                        $(event.data.realInput).addTag(fakeInputVal);
                        return false;
                    }

                });

                fakeInputElement.on( 'keyup', data, function(event){
                    var fakeInput = $(event.data.fakeInput);
                    $(this).autosizeInput(fakeInput);
                });


                fakeInputElement.on( 'keydown', function(event){
                    if(event.keyCode === 8){
                        $(this).removeClass('tag-this--invalid');
                    }
                });


                //Removes the tag-this--invalid class when user changes the value of the fake input
                if(data.noDuplicates) {
                    fakeInputElement.on('keydown', function(event){
                        if(event.keyCode === 8 || String.fromCharCode(event.which).match(/\w+|[áéíóúÁÉÍÓÚñÑ,/]+/)) {
                            $(this).removeClass('tag-this--invalid');
                        }
                    });
                }

            } // if settings.interactive

        });

        if (options && options.width && options.height){
            wrapper = $('#tag-this--'+this[0].id);

            $(wrapper).css({
                'width' : options.width,
                'height' : options.height
            });
        }

        return this;
    };

    $.fn.addTag = function(data) {

        var settings = $(this).data('settings');

        this.each(function() {

            //get ID of this particular input
            var id = $(this).attr('id');
            var tagIsInvalid = false;
            var tag, tags, func, dataToPass;

            //clear an existing error
            $('#'+id+'--tag').removeClass('tag-this--invalid');

            //grab any existing tags
            var existingTags = $(this).data('tags');

            //if no tags in the array, make a new one
            if (!existingTags) {
                tags = [];
            }
            else {
                tags = existingTags;
            }

            //call a beforeAddTag callback if it was set in the settings
            if (settings.callbacks && callbacks[id] && callbacks[id]['beforeAddTag']) {
                func = callbacks[id]['beforeAddTag'];
                dataToPass = {
                    context : $(this),
                    tags : tags,
                    attemptedInput : data
                };
                func.call(this, dataToPass);
            }

            //validation
            var tagValidationInfo = $(this).validateAddTag(data, settings, tags);

            //if the tag is invalid, indicate to the user
            if ( tagValidationInfo.tagIsInvalid ) {
                tag = $('#'+id+'--tag');
                tag.addClass('tag-this--invalid');
                tag.trigger('focus');
                $(this).relayError(id, data, settings, tags, tagValidationInfo.errors);
                return false;
            }



            if (data) {

                //if we're passing a string (like an email), generate an id for it
                if (!data.id){

                    //get the id- passing in the current tags to make sure we don't use an id that already exists
                    var newId = $.fn.tagThis.generateUniqueTagId(tags);

                    //set up the tag to be created- the passed value of data in this case will be the string we're making a tag out of
                    data = {
                        id : newId,
                        text : data
                    };
                }

                //create a new tag and put it in the DOM
                $('<span>').addClass('tag').attr('data-id', data.id).append(

                    $('<span>').text(data.text),

                    $('<button>', {
                        title : 'Click to remove ' + data.text,
                        text  : 'x',
                        'class' : 'tag-this--remove-tag'
                    }).on('click', function () {
                        return $('#' + id).removeTag(data);
                    }))
                .insertBefore('#' + id + '--addTag');

                //update the tags array
                tags.push(data);

                //clear out the input
                $('#'+id+'--tag').val('');

                $(this).data('tags', tags);

                tag = $('#'+id+'--tag');
                tag.trigger('focus');
                $(this).resetInputSize(tag);

                //call any callbacks we were passed for afterAddTag
                if (settings.callbacks && callbacks[id] && callbacks[id]['afterAddTag']) {
                    func = callbacks[id]['afterAddTag'];
                    dataToPass = {
                        context : $(this),
                        tags : tags,
                        addedInput : data
                    };
                    func.call(this, dataToPass);
                }
                if(callbacks[id] && callbacks[id]['onChange'])
                {
                    func = callbacks[id]['onChange'];
                    dataToPass = {
                        context : $(this),
                        tags : tags,
                        addedInput : data
                    };
                    func.call(this, dataToPass);
                }
            }

        });

        return false;
    };

    $.fn.validateAddTag = function(data, settings, tags){

        var errors = {}, tagIsInvalid, tagValidationInfo;

        //initialize errors
        errors.maxTagsReached = false;
        errors.maxCharsReached = false;
        errors.failedCustomRegex = false;
        errors.emailIsInvalid = false;
        errors.isDuplicate = false;


        //if there's a custom regex pattern, validate against it
        if (settings.regex && !settings.email && !data.id){
            var failedCustomRegex = $(this).failedCustomRegex(data, settings);
            if (failedCustomRegex){
                tagIsInvalid = true;
                errors.failedCustomRegex = true;
            }
        }

        //if this is an email, validate it
        if (settings.email) {

            var emailIsInvalid = $(this).emailIsInvalid(data);

            //if it's not valid, set the option to pass into the error method
            if (emailIsInvalid){
                tagIsInvalid = true;
                errors.emailIsInvalid = true;
            }
        }

        //if we don't allow dupes, check for dupes
        if (settings.noDuplicates) {

            var tagIsDuplicate = $(this).tagExists(settings, data);

            if ( tagIsDuplicate === true ) {
                //Indicate to the user that this is not a valid tag
                tagIsInvalid = true;
                errors.isDuplicate = true;
            }
        }

        //if we care about a max count of tags, check to see if we're at the limit
        if (settings.maxTags && settings.maxTags === tags.length){
            tagIsInvalid = true;
            errors.maxTagsReached = true;
        }

        //if we care about max chars, check to see if we're at the limit
        if (settings.maxChars > 0) {

            var maxCharsReached = false;

            if (data.id){
                maxCharsReached = data.text.length > settings.maxChars;
            }
            else{
                maxCharsReached = data.length > settings.maxChars;
            }

            if (maxCharsReached){
                errors.maxCharsReached = true;
                tagIsInvalid = true;
            }
        }

        tagValidationInfo = {
            tagIsInvalid : tagIsInvalid,
            errors : errors
        };


        return tagValidationInfo;
    };

    $.fn.removeTag = function(data) {

        this.each(function() {

            var id = $(this).attr('id');
            var func, dataToPass, tags;

            //call the before callback
            if (callbacks[id] && callbacks[id]['beforeRemoveTag']) {
                func = callbacks[id]['beforeRemoveTag'];
                dataToPass = {
                    context : $(this),
                    tags : tags,
                    inputToBeRemoved : data
                };
                func.call(this, dataToPass);
            }

            tags = $(this).data('tags');

            //remove the tag from the data attribute
            if (tags){

                //if we're passing the 'id' of a tag to be removed
                if (data.id){

                    //remove the physical tag
                    $('#tag-this--'+ id +' .tag[data-id="'+ data.id +'"]').remove();

                    //remove it from the object
                    for (var i=0; i < tags.length; i++) {
                        if (tags[i].id === data.id) {
                            tags.splice(i, 1);
                        }
                    }
                }
                //otherwise just find the text to determine which tag to remove
                else{
                    //remove physical tag
                    $('#tag-this--'+ id +' .tag').each(function(){
                        if ($(this).find('span').text() === data){
                            $(this).remove();
                        }
                    });
                    //remove from object
                    for (var n=0; n < tags.length; n++) {
                        if (tags[n].text === data) {
                            tags.splice(n, 1);
                        }
                    }
                }

                //since we just removed the deleted tag from the object, re-store the new object on the input
                $(this).data('tags', tags);

                //call any callbacks we passed
                if (tags && callbacks[id] && callbacks[id]['afterRemoveTag']) {
                    func = callbacks[id]['afterRemoveTag'];
                    dataToPass = {
                        context : $(this),
                        tags : tags,
                        removedInput : data
                    };
                    func.call(this, dataToPass);
                }
                if(callbacks[id] && callbacks[id]['onChange'])
                {
                    func = callbacks[id]['onChange'];
                    dataToPass = {
                        context : $(this),
                        tags : tags,
                        removedInput : data
                    };
                    func.call(this, dataToPass);
                }
            }

        });

        return false;
    };

    $.fn.tagExists = function(settings, data) {

        //check to see if our tag already exists on the input
        var tags = $(this).data('tags');

        //if nothing comes back from .data(), there's no tags, so return false
        if (!tags){
            return false;
        }

        //if it's an interactive input, data comes back as a string, so just check the data variable itself
        if(settings.interactive || !data.id){

            //check the text fields that exist against the one just entered, return true if it exists
            for (var i = 0; i < tags.length; i++) {
                if (tags[i].text === data){
                    return true;
                }
            }

        }
        //if we've been supplied an ID already
        else if(data.id) {

            //check the ids that exist against the one just entered, return true if it exists
            for (var n = 0; n < tags.length; n++) {
                if (tags[n].id === data.id){
                    return true;
                }
            }

        }

        //return false otherwise
        return false;
    };

    $.fn.autosizeInput = function(input){

        var inputWidth = input.width(), newWidth;

        if(input[0].scrollWidth - inputWidth > 0){
            newWidth = inputWidth + 30;
        }

        input.css('width', newWidth);
    };

    $.fn.resetInputSize = function(input){
        input.css('width', originalInputWidth);
    };

    $.fn.emailIsInvalid = function(email) {

        // regex to check an email. this should always be checked on the server as well.
        var valid = emailRegex.test(email);

        if (valid) {
            return false;
        }
        else{
            return true;
        }
    };

    $.fn.failedCustomRegex = function(input, settings) {

        var re = settings.regex;
        // regex to check an email. this should always be checked on the server as well.
        var valid = re.test(input);

        if (valid) {
            return false;
        }
        else{
            return true;
        }
    };

    $.fn.relayError = function(id, data, settings, tags, errors){

        //call any callbacks we passed
        if (settings.callbacks && callbacks[id] && callbacks[id]['errors']) {

            var returnData = {
                id : id,
                attemptedToTag : data,
                settings : settings,
                tags : tags,
                errors : errors
            };

            var func = callbacks[id]['errors'];
            func.call(this, returnData);
        }
    };

    $.fn.clearAllTags = function(){

        var id = $(this).attr('id');
        var tagList = $('#tag-this--'+id);
        var input = $('#'+id+'--tag');
        var incompleteTag = tagList.parent().find('.tag-this--invalid');
        var defaultText;

        tagList.find('.tag').remove();

        $(this).data('tags','');

        if(incompleteTag){
            defaultText = incompleteTag.data('default');
            incompleteTag.removeClass('tag-this--invalid').val(defaultText);
            incompleteTag.trigger('blur');
        }

        $(this).resetInputSize(input);
    };

    $.fn.tagThis.generateUniqueTagId = function(tags) {
        var min = 1;
        var max = 7000;
        var random = Math.floor(Math.random() * (max - min + 1)) + min;

        //make sure id doesn't already exist
        for (var i=0; i < tags.length; i++) {
            if (tags[i].id === random && i < 1000) {
                $(this).generateUniqueTagId();
            }
        }
        return random;
    };

    $.fn.destroy = function(){
        //destroys this input
        $(this).next().remove();
        $(this).show();
    };

    $.tagThisDestroyAll = function(){
        //destroys all inputs
        $('.tag-this').each(function(){
            $(this).prev().show();
            $(this).remove();
        });
    };

})(jQuery);

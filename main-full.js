<script type="text/javascript" nonce="%%=v(@guid)=%%">
  // Set Tempus Dominus icons globally
  tempusDominus.extend(window.tempusDominus.plugins.bi_one.load);
  
  function sanitizeDataExtensionName(name) {
    return (name || "").replace(/[^A-Za-z0-9_ -]/g, '');
  }
  
  // Set buttons to loading
  function loading() {
    $("html,body").css("cursor", "wait");
    $(".slds-spinner_container").css('display', 'block');
    $("#btnLoadDE").prop("disabled", true);
    $("#btnChangeFields").prop("disabled", true);
    $("#btnSave").prop("disabled", true);
    $("#btnFilterDE").prop("disabled", true);
  }
  
  // Automatically sanitize DE Name
  $('#inputDEName').on('input', function() {
    let cleanedValue = sanitizeDataExtensionName($(this).val());

    // Only update if the cleaned value is different (prevents cursor jump)
    if ($(this).val() !== cleanedValue) {
      $(this).val(cleanedValue);
    }
  });
  
  $('.btnLoadType').on("click", function(e) {
    $('#loadTypeHiddenInput').val($(this).val());
  });
  $('#changeDEForm').on("submit", function(e) {
    $("inputDEName").val(sanitizeDataExtensionName($("inputDEName").val()));
    if (!$('#inputDEName').val())
      return false;
    loading();
    return true;
  });

  %%[ IF EMPTY(@deName) THEN ]%%
  $("footer").addClass("fixed-bottom");
  %%[ ENDIF ]%%
</script>

%%[ IF NOT EMPTY(@deName) AND @hasError != "True" THEN ]%%
<script type="text/javascript" nonce="%%=v(@guid)=%%">
  var de_name = '%%=v(@deName)=%%';
  var has_error = '%%=v(@hasError)=%%';
  var table_fields_selected = %%=v(@tableFieldsSelected)=%%;
  var js_filter_fields = [%%=v(@jsFilterFields)=%%];
  var js_hot_headers = %%=v(@jsHOTHeaders)=%%;
  var filtersQueryBuilder_rules = '%%=v(@filtersQueryBuilderRules)=%%';
  var page_count = %%=v(@pageCount)=%%;
  var folder_id = %%=v(@folderID)=%%;
  var order_by = %%=v(@orderBy)=%%;

  // HandsOnTable Apply Validator
  for (var i = 0; i < js_hot_headers.length; i++) {
    js_hot_headers[i].validator = function(value, callback) {
      var field_type = this.fieldType;
      var min_length = this.minLength || 0;
      var max_length = this.maxLength || 4000;
      var is_required = this.isRequired;
      var regex_number = /^-?[0-9]+$/;
      var regex_email = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;
      var regex_locale = /^[A-Za-z]{2}(-[A-Za-z]{2})?$/;
      var regex_phone = /^(1?\d[- ]?)?(\(?\d{3}\)?[- ]?)\d{3}[- ]?\d{4}$/;
      var regex_datetime = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/\d{4} (0[1-9]|1[0-2]):[0-5]\d:[0-5]\d (AM|PM)$/i;
      if (is_required && (value == null || value == ""))  // Empty value for required field - Invalid
        callback(false);
      else if (!is_required && (value == null || value == "")) // Empty value for nullable field - Valid
        callback(true);
      else if (field_type === "Number" && (!regex_number.test(value) || value < -2147483648 || value > 2147483648))  // Number field out-of-bound - Invalid
        callback(false);
      else if (field_type === "Decimal") {
        var regex_decimal = new RegExp("^-?[0-9]{0," + (this.maxLength - this.scale) + "}([\.][0-9]{1," + this.scale + "})?$");
        if (!regex_decimal.test(value))  //  Decimal field in wrong format - Invalid
          callback(false);
        else
          callback(true);
      }
      else if (field_type === "EmailAddress" && !regex_email.test(value))  //  Email field in wrong format - Invalid
        callback(false);
      else if (field_type === "Locale" && !regex_locale.test(value))  //  Locale field in wrong format - Invalid
        callback(false);
      else if (field_type === "Date" && !regex_datetime.test(value))  //  Datetime field in wrong format - Invalid
        callback(false);
      else if (field_type === "Phone" && !regex_phone.test(value))  //  Phone field in wrong format - Invalid
        callback(false);
      else if (value.length < min_length)  // Text field with less than Min Length - Invalid
        callback(false);
      else if (field_type !== "Decimal" && value.length > max_length)  // Text field with more than Max Length - Invalid
        callback(false);
      else
        callback(true);
    };
  }

  function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
      return String.fromCharCode(parseInt(p1, 16))
    }))
  }
  function b64DecodeUnicode(str) {
    return decodeURIComponent(Array.prototype.map.call(atob(str), function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
    }).join(''))
  }

  $(function() {
    // Initialize Tooltips
    $('[data-toggle="tooltip"]').tooltip();

    // Initialize Multiselect
    $('#table_fields').on('changed.bs.select', function(e, clickedIndex, isSelected, previousValue) {
      var selections = $('.selectpicker').selectpicker('val');
      if (JSON.stringify(selections) !== JSON.stringify(table_fields_selected)) {
        $("#btnChangeFields").removeClass("btn-outline-secondary").addClass("btn-info").prop("disabled", false);
        var selected = [];
        for (var i = 0; i < selections.length; i++)
          selected.push(selections[i]);
        $("#table_fields_selected").val(JSON.stringify(selected));
      }
      else
        $("#btnChangeFields").addClass("btn-outline-secondary").removeClass("btn-info").prop("disabled", true);
    });

    // Pagination Change
    $('.paginationSearch').pagination({
      items: page_count,
      itemOnPage: 8,
      currentPage: $("#inputPage").val(),
      cssStyle: '',
      prevText: '<span aria-hidden="true">&laquo;</span>',
      nextText: '<span aria-hidden="true">&raquo;</span>',
      onPageClick: function (page, evt) {
        $("#inputPage").val(page);
        $("#filterForm").submit();
      }
    });
    $('.pagination > li').addClass('page-item');
    $('.pagination > li > span').addClass('page-link');

    // Page Size Change
    $('#btnPageSize').on('click', function() {
      $("#inputPage").val(1);
      $("#filterForm").submit();
    });

    // Resize All Fields
    $("#btnResizeAllFields").on('click', function() {
      $("html,body").css("cursor", "wait");
      $(".slds-spinner_container").css('display', 'block');
      autoResizeColumnsWidth($("#table")[0]);
    });

    // Redesign Pre-Load button
    if (de_name && has_error != "True")
      $("#btnLoadDE").removeClass("btn-info").addClass("btn-outline-secondary");

    // Remove empty filter
    if (filtersQueryBuilder_rules.length === 0)
      $(".rule-container").find(".btn-danger").click();
  });

  // Query Builder
  if (de_name && has_error != "True") {
    // Add validation for Date filters with Between operator
    for (var i = 0; i < js_filter_fields.length; i++) {
      if (js_filter_fields[i].validation && js_filter_fields[i].validation.messages && js_filter_fields[i].validation.messages.format === "The provided date is not in a valid format (M/D/YYYY h:mm:ss AM/PM).") {
        js_filter_fields[i].validation.callback = function(value, rule) {
          var regex = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/\d{4} (0[1-9]|1[0-2]):[0-5]\d:[0-5]\d (AM|PM)$/i;
          if (typeof value === "object") {
            if (regex.exec(value[0]) !== null && regex.exec(value[0]) !== null)
              return true;
          }
          else if (regex.exec(value) !== null)
            return true;
          return 'The provided date is not in a valid format (M/D/YYYY h:mm:ss AM/PM).';
        };
      }
    }
    
    var qb = {
      allow_empty: true,
      allow_groups: false,
      operators: $.fn.queryBuilder.constructor.DEFAULTS.operators.concat([  // Concat the new operators
        { type: 'is_empty_null', nb_inputs: 0, multiple: false, apply_to: ['string'] },
        { type: 'is_not_empty_null', nb_inputs: 0, multiple: false, apply_to: ['string'] }
      ]),
      lang: {  // Translate the new operators
        operators: {
          equal: 'equals',
          not_equal: 'does not equal',
          is_empty_null: 'is empty or null',
          is_not_empty_null: 'is not empty or null'
        }
      },
      filters: js_filter_fields,
      rules: {
        condition: "AND",
        rules: [],
        valid: true
      }
    };

    $('#filtersQueryBuilder').queryBuilder(qb).on('rulesChanged.queryBuilder', function(e, rule, error, value) {
      try {
        var validation = $('#filtersQueryBuilder')[0].queryBuilder.validate(false);
        if (validation === true && $("#filtersQueryBuilder")[0].queryBuilder.getRules() && $("#filtersQueryBuilder")[0].queryBuilder.getRules().rules.length > 0) {
          $("#btnLoadDE").removeClass("btn-info").addClass("btn-outline-secondary");
          $("#btnFilterDE").removeClass("btn-outline-secondary").addClass("btn-info").prop("disabled", false);
        }
        else {
          $("#btnFilterDE").removeClass("btn-info").addClass("btn-outline-secondary").prop("disabled", true);
        }
      } catch (err) {}
    }).on('afterCreateRuleInput.queryBuilder', function(e, rule) {
      $("#filtersQueryBuilder input").attr('autocomplete', 'off');  // Disable autocomplete on inputs in QueryBuilder
      
      // Add Datetime plugin for date fields
      if (rule.filter.validation && rule.filter.validation.messages && rule.filter.validation.messages.format === "The provided date is not in a valid format (M/D/YYYY h:mm:ss AM/PM).") {
        let inputs = rule.$el.find('.rule-value-container input');
        for (var i = 0; i < inputs.length; i++) {
          let input = inputs[i];
          input.setAttribute('id', 'dti-' + input.name);
          new tempusDominus.TempusDominus(document.getElementById('dti-' + input.name), {
            useCurrent: false,
            localization: {
              format: 'M/d/yyyy hh:mm:ss T'
            },
            display: {
              sideBySide: true,
              theme: 'light',
              buttons: {
                today: true,
                clear: true
              },
              components: {
                seconds: true
              }
            }
          });
        }
      }
    }).on('afterSetRules.queryBuilder', function(e) {
      // Add Datetime plugin for date fields
      var filters = e.builder.filters;
      var model = e.builder.getModel();
      var rules = e.builder.getRules().rules;
      for (var r = 0; r < rules.length; r++) {
        var rule = rules[r];
        var filter;
        for (var i = 0; i < filters.length; i++) {
          if (filters[i].id === rule.id) {
            filter = filters[i];
            break;
          }
        }
        
        if (filter.validation && filter.validation.messages && filter.validation.messages.format === "The provided date is not in a valid format (M/D/YYYY h:mm:ss AM/PM).") {
          let inputs = model.rules[r].$el.find('.rule-value-container input');
          for (var i = 0; i < inputs.length; i++) {
            let input = inputs[i];
            input.setAttribute('id', 'dti-' + input.name);
            
            var value;
            if (rule.value) {
              if (typeof rule.value === "object")
                value = new Date(rule.value[i]);
              else
                value = new Date(rule.value);
            }
            
            var td = new tempusDominus.TempusDominus(document.getElementById('dti-' + input.name), {
              defaultDate: value,
              useCurrent: false,
              localization: {
                format: 'M/d/yyyy hh:mm:ss T'
              },
              display: {
                sideBySide: true,
                theme: 'light',
                buttons: {
                  today: true,
                  clear: true
                },
                components: {
                  seconds: true
                }
              }
            });
          }
        }
      }
    }).on('validationError.queryBuilder', function(e, rule, error, value) {
      if (error[0] === "no_filter") {
        e.preventDefault();
      }
    }).on('afterUpdateRuleOperator.queryBuilder', function(e, rule) {
      if (rule.__.operator.type === 'in') {
        rule.$el.find('.rule-value-container input').selectize({
          plugins: ['remove_button'],
          delimiter: '\t',
          persist: false,
          create: true
        });
      }
      else {
        try {
          rule.$el.find($.fn.queryBuilder.constructor.selectors.rule_value)[0].selectize.destroy();
        } catch(err) {}
      }
    });
    
    // Initialize Query Builder with previous filter rules
    if (filtersQueryBuilder_rules.length > 0) {
      var rules = JSON.parse(filtersQueryBuilder_rules.replace(/&quot;/g, '"').replace(/\t/g, "\\t"));
      $('#filtersQueryBuilder').queryBuilder('setRules', rules);
      $("#btnLoadDE").removeClass("btn-info").addClass("btn-outline-secondary");
    }

    // Resize input field automatically while typing
    $(document).on('keyup change paste', '#filtersQueryBuilder .rule-value-container input', function(e, rule) {
      if ($(this)[0].className === "form-control") {
        var $this = $(this);
        setTimeout(function() {
          $this.attr("size", Math.max(20, $this.val().length + 3));
        }, 0);
      }
    });

    var changes = {};
    var headers = JSON.parse(b64DecodeUnicode($('#headers').val()));
    var sourceData = JSON.parse(b64DecodeUnicode($('#data').val()));
    var originalData = [];
    var rowsRemoved = [];
    for (var i = 0; i < sourceData.length; i++) {
      var oldData = {};
      for (var j = 0; j < headers.length; j++) {
        if (sourceData[i][j])
          oldData[headers[j]] = sourceData[i][j];
        else
          oldData[headers[j]] = null;
      }
      originalData.push(oldData);
    }

    var data = sourceData;
    if (data.length === 0)
      data = [[]];

    // HandsOnTable
    var hot;
    var hot_errors = 0;
    if (de_name && has_error != "True") {
      var initializing_hot = true;
      
      // Initialize HandsOnTable
      hot = new Handsontable(document.getElementById('table'), {
        licenseKey: 'non-commercial-and-evaluation',
        data: data,
        minRows: 1,
        minCols: js_hot_headers.length,
        minSpareRows: 1,
        renderAllRows: true,
        columnSorting: {
          initialConfig: order_by
        },
        beforeColumnSort: function (currentSortConfig, destinationSortConfigs) {
          if (initializing_hot) {
            initializing_hot = false;
            return true;
          }
          else if (currentSortConfig.length !== destinationSortConfigs.length
              || (currentSortConfig.length > 0
                  && destinationSortConfigs.length > 0
                  && (currentSortConfig[0].column !== destinationSortConfigs[0].column || currentSortConfig[0].sortOrder !== destinationSortConfigs[0].sortOrder))) {
            $("#orderBy").val(JSON.stringify(destinationSortConfigs));
            $("#inputPage").val(1);
            $("#filterForm").submit();
            return false;
          }
          return true;
        },
        autoWrapRow: true,
        wordWrap: true,
        fillHandle: true,
        rowHeaders: true,
        copyPaste: {
          copyColumnHeaders: true
        },
        columns: js_hot_headers,
        manualColumnResize: true,
        manualRowResize: true,
        width: $(window).width() - 50,
        height: Math.max(400, $(window).height() - $("#hotWrapper").offset().top - 45),
        colWidths: ($('#hotWrapper').width() - 85)/js_hot_headers.length,
        contextMenu: {
          items: {
            'remove_row': {},
            'hsep1': '---------',
            'alignment': {},
            'hsep2': '---------',
            'cut': {},
            'copy': {},
            'copy_with_column_headers': {}
          }
        },
        undo: false,
        /*afterUndo: function (action) {
          console.dir(action);
        },
        afterUndoStackChange: function (doneActionsBefore, doneActionsAfter) {
          console.log("doneActionsBefore", doneActionsBefore);
          console.log("doneActionsAfter", doneActionsAfter);
        },
        afterRedoStackChange: function (undoneActionsBefore, undoneActionsAfter) {
          console.log("undoneActionsBefore", undoneActionsBefore);
          console.log("undoneActionsAfter", undoneActionsAfter);
        },*/
        allowInsertColumn: false,
        allowInsertRow: true,
        allowRemoveColumn: false,
        allowRemoveRow: true,
        beforeChange: (changes, source) => {
          for (var i = 0; i < changes.length; i++) {
            var column = changes[i][1];
            var fieldType = js_hot_headers[column].fieldType;
            var value = changes[i][3];
            var datetimeFormat = hot.getColumnMeta(column).datetimeFormat;
            if (fieldType === "Date" && datetimeFormat) {
              var formattedDatetime = moment(value).format(datetimeFormat);
              if (formattedDatetime !== "Invalid date")
                changes[i][3] = formattedDatetime;
            }
            else if (fieldType === "Boolean") {
              changes[i][3] = (changes[i][3] + '').replace(/^(1|y|yes)$/i, true).replace(/^(0|n|no)$/i, false);
            }
          }
        },
        afterChange: function(change, source) {
          if (source === 'loadData')
            return; // Don't save this change

          if (change.length == 1 && change[0][2] == change[0][3])
            return; // Nothing changed

          if (change[0][2] === null && change[0][3] === "")
            return; // Fake update on blank value - Skip it

          // Keep rows that changed
          for (var i = 0; i < change.length; i++) {
            var rowData = {};
            var rowNumber = change[i][0];
            var row = hot.getDataAtRow(rowNumber);
            if (originalData[rowNumber]) {
              for (var j = 0; j < headers.length; j++) {
                var originalValue = originalData[rowNumber][headers[j]];
                var originalValueIsBoolean = js_hot_headers[j].fieldType === "Boolean";
                if (((!originalValueIsBoolean && originalValue !== row[j]) 
                     || (originalValueIsBoolean && String(originalValue).toLowerCase() !== String(row[j]).toLowerCase())) 
                    && (originalValue !== null || row[j] !== ""))
                  rowData[headers[j]] = row[j];
              }
              if (!$.isEmptyObject(rowData))  // Something changed in this row
                changes[rowNumber] = rowData;
              else if ($.isEmptyObject(rowData) && changes.hasOwnProperty(rowNumber))  // The changes were reverted back - No need to update
                delete changes[rowNumber];
            }
            else {
              for (var j = 0; j < headers.length; j++)
                rowData[headers[j]] = row[j];
              changes[rowNumber] = rowData;
            }
          }

          // Validate rows
          var rowsToValidate = Array.from({ length: hot.countRows()-1 }, (_, i) => i);
          hot.validateRows(rowsToValidate, (valid) => {
            // Enable/Disable the Save button
            if (valid && (Object.keys(changes).length > 0 || rowsRemoved.length > 0))
              $("#btnSave").removeClass("btn-outline-secondary").addClass("btn-warning").prop("disabled", false);
            else
              $("#btnSave").removeClass("btn-warning").addClass("btn-outline-secondary").prop("disabled", true);
          });
        },
        afterRemoveRow: function (index, amount) {
          // Enable/Disable the Save button
          setTimeout(function() {
            if ($(".handsontable td.htInvalid").length === 0)
              $("#btnSave").removeClass("btn-outline-secondary").addClass("btn-warning").prop("disabled", false);
            else
              $("#btnSave").removeClass("btn-warning").addClass("btn-outline-secondary").prop("disabled", true);
          }, 100);

          for (var i = 0; i < amount; i++) {
            rowsRemoved.push(originalData[index]);
            originalData.splice(index, 1);
            for (var ind in changes) {
              ind = parseInt(ind);
              if (index < ind) {
                changes[ind-1] = changes[ind];
                delete changes[ind];
              }
              else if (ind === index)
                delete changes[ind];
            }
          }
        },
        beforeCopy: function (data, coords, copiedHeadersCount) {
          var regex = /(<([^>]+)>)/ig;
          if (copiedHeadersCount.columnHeadersCount === 1) {
            for (var i = 0; i < data[0].length; i++)
              data[0][i] = data[0][i].replace(regex, "").replace("&nbsp;", "");
          }
        }
      });
      %%[ IF @hasData == 'True' THEN ]%%
      document.getElementById('btnDownloadCSV').addEventListener('click', () => {
        var hiddenEl = document.getElementById('hiddenHotTable');
        var tmpHot = new Handsontable(hiddenEl, {
          licenseKey: 'non-commercial-and-evaluation',
          data: hot.getData(),
          columns: JSON.parse(JSON.stringify(js_hot_headers).replace(/<[^>]*>/g, ''))
        });
        var exportPlgn = tmpHot.getPlugin('exportFile'); 
        exportPlgn.downloadFile('csv', {
          columnHeaders: true,
          filename: de_name + '_[YYYY][MM][DD]'
        });
        tmpHot.destroy();
      });
      
      document.getElementById('btnCopyAll').addEventListener('click', () => {
        var selection = hot.getSelected();
        hot.selectAll();
        hot.getPlugin('copyPaste').copy('with-column-headers');
        hot.selectCells(selection);
      });
      %%[ ENDIF ]%%
      function autoResizeColumnsWidth(element, retry = true) {
        element.resizeInProgress = true;
        const domID = element.id; // 'element_HTcontainer_' + element.id;
        const getHandle = function () {
          let colHeaders = document.getElementById(domID).querySelectorAll('.ht_clone_top thead th');
          for (let header of colHeaders) {
            setTimeout(function() {
              header.dispatchEvent(
                new MouseEvent('mouseover', {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                })
              );
            }, 50);
          }
          let hdle = document.getElementById(domID).getElementsByClassName('manualColumnResizer');
          if (hdle.length > 0) {
            return hdle[0];
          }
        };
        setTimeout(function() {
          let handle = getHandle();
          if (handle) {
            let sheet = document.styleSheets[0];
            if (sheet) {
              // Adds CSS rules to hide highlight on headers, cells and borders
              let indexHeaders = sheet.insertRule('#' + domID + ' tbody th.ht__active_highlight, .handsontable thead th.ht__active_highlight {background: #f0f0f0 !important; opacity: 1;}');
              let indexCells = sheet.insertRule('#' + domID + ' td.area::before {background-color: #fff !important;}');
              let indexBorders = sheet.insertRule('#' + domID + ' .wtBorder {display: none !important;}');
              // Resetting handle
              handle.dispatchEvent(
                new MouseEvent('mouseup', {
                  bubbles: true,
                  cancelable: true,
                  view: window,
                })
              );
              // 1. Selects all cells
              hot.selectAll();
              setTimeout(function() {
                // 2. Simulates double-click
                for (let i = 0; i < 2; i++) {
                  handle.dispatchEvent(
                    new MouseEvent('mousedown', {
                      bubbles: true,
                      cancelable: true,
                      view: window,
                    })
                  );
                  handle.dispatchEvent(
                    new MouseEvent('mouseup', {
                      bubbles: true,
                      cancelable: true,
                      view: window,
                    })
                  );
                }
                setTimeout(function() {
                  // 3. Deselects all cells
                  hot.deselectCell();
                  element.resizeInProgress = false;
                  // Removes previously introduced CSS rules
                  sheet?.deleteRule(indexCells);
                  sheet?.deleteRule(indexHeaders);
                  sheet?.deleteRule(indexBorders);

                  // 4. Finish loading process
                  $("html,body").css("cursor", "auto");
                  $(".slds-spinner_container").css('display', 'none');
                }, 750);
              }, 50);
            }
          } else {
            if (retry) {
              autoResizeColumnsWidth(element, false);
            } else {
              element.resizeInProgress = false;
            }
          }
        }, 700);
      };
    }
  }

  $('#filterForm').on("submit", function(e) {
    $("inputDEName").val(sanitizeDataExtensionName($("inputDEName").val()));
    $("#filtersQueryBuilder_rules").val(JSON.stringify($("#filtersQueryBuilder")[0].queryBuilder.getRules()));
    loading();
    return true;
  });
  
  $(document).on("click", "#btnFilterDE", function(e) {
    $("#inputPage").val(1);
    $("#filterForm").submit();
  });

  $('#saveForm').on("submit", function(e) {
    if (Object.keys(changes).length === 0 && rowsRemoved.length === 0)  // Prevent Saving without any changes
      return false;

    $("inputDEName").val(sanitizeDataExtensionName($("inputDEName").val()));
    var dataToUpdate = [];
    for (var index in changes) {
      if (index in originalData)
        dataToUpdate.push({'original': originalData[index], 'new': changes[index]});
      else {
        var data = {};
        var row = hot.getDataAtRow(index);
        for (var i = 0; i < headers.length; i++)
          data[headers[i]] = row[i];
        dataToUpdate.push({'new': data});
      }
    }
    for (var i = 0; i < rowsRemoved.length; i++)
      dataToUpdate.push({'deleted': rowsRemoved[i]});

    $('#dataToUpdateHidden').val(b64EncodeUnicode(encodeURIComponent(JSON.stringify(dataToUpdate))));

    $("#filterForm").submit();

    e.preventDefault();
    return false;
  });

  $(window).resize(function() {
    if (hot) {
      hot.updateSettings({
        width: $(window).width() - 50,
        height: $(window).height() - $("#hotWrapper").offset().top - 20,
        colWidths: ($('#hotWrapper').width() - 70)/headers.length
      });
    }
  });
</script>
%%[ ENDIF ]%%

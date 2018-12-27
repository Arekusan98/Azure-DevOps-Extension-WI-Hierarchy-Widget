/// <reference path="treetable.d.ts"/>
"use strict";

import Controls = require("VSS/Controls");
import Grids = require("VSS/Controls/Grids");

import RestClient = require("TFS/Work/RestClient");
import CoreContracts = require("TFS/Core/Contracts");
import WorkContracts = require("TFS/Work/Contracts");
import RestClientWI = require("TFS/WorkItemTracking/RestClient");
import WorkItemsContracts = require("TFS/WorkItemTracking/Contracts");
import WorkItemServices = require("TFS/WorkItemTracking/Services");
import Services = require("VSS/Authentication/Services");
import { all, Promise } from "q";
import * as Q from "q";
import * as J from "@priotas/jquery-treetable";

import * as SDK from "azure-devops-extension-sdk";

export class BacklogItemHierarchyWidget {

  constructor(public WidgetHelpers) {
  }

  public client = RestClient.getClient();
  public clientwi = RestClientWI.getClient();
  public data = [];
  public wiTypes = [];
  public wiIndex = 0;
  public Tablecontainer = $("#witable");
  public $title = $("h2");

  public LoadWidget(widgetSettings, isReload) {
    $("#witable").hide();
    let customSettings = <ISettings>JSON.parse(widgetSettings.customSettings.data);
    this.$title.text(widgetSettings.name);
    if (customSettings) {

      $("#configwidget").hide();
      $("#content").hide();

      this.getWiTypes().then(types => {
        this.wiTypes = types;
      }).then(() => {
        this.GetWIHierarchy([customSettings.wiId], customSettings).then(e => {

          // composition du tableau final
          let result = this.ComposeTabTree(customSettings.parentwiasheader);

          // Affiche le resultat dans le table
          $("#witable tbody").empty();
          this.WriteHtmlTable(result, customSettings);
          this.LoadTreeTableJquery(isReload, customSettings);

          $("#witable").show();
          $("#content").show();
        });
      });
    } else {
      this.$title.attr("style", "color:grey");
      $("#content").hide();
      $("#configwidget").show();
    }
    return this.WidgetHelpers.WidgetStatusHelper.Success();
  }

  private LoadTreeTableJquery(isReload: any, customSettings: ISettings) {
    $("#witable").treetable({
      expandable: isReload ? false : customSettings.expandtree, clickableNodeNames: false, onInitialized: function () {
        $("#witable tr").each((i, el) => {
          let spaceExpand = 0;
          if (customSettings.expandtree) {
            spaceExpand = 20;
          }
          let nameWidth = 250 - (12 + $(el).find("td:nth-child(2) .indenter").outerWidth() + spaceExpand);
          $(el).find("td:nth-child(2) #linkwi").width(nameWidth);
        });
        $("#witable #linkwi").on("click", (event) => {
          let current = $(event.target).closest("tr");
          WorkItemServices.WorkItemFormNavigationService.getService().then(service => {
            service.openWorkItem(Number(current.attr("data-tt-id")), false); // open the wi dialog
          });
        });
      }
    }, true);
  }

  private WriteHtmlTable(result: any, customSettings) {
    result.forEach((element) => {
      let statecolumn = this.getColorState(element.state) + " " + element.state;
      let isHeader = customSettings.parentwiasheader && element.parentid === 0;
      // infos du wi type
      let type = this.wiTypes.filter(x => x.name === element.witype);
      let imagetype = "<img src=" + type[0].icon.url + " class=\"imgwitype\" />";
      let namecolumn = imagetype + " " + this.getName(element.name, element.id, !isHeader);
      if (isHeader) {
        this.$title.html(namecolumn);
      } else {
        this.appendTableColumn(this.Tablecontainer, [element.id, namecolumn, statecolumn], element.id, element.parentid);
      }
    });
  }

  private ComposeTabTree(firstAsHeader: boolean) {
    let hashArr = {};
    let i = 0;
    for (i = 0; i < this.data.length; i++) {
      if (hashArr[this.data[i].parentid] === undefined) {
        hashArr[this.data[i].parentid] = [];
      }
      hashArr[this.data[i].parentid].push(this.data[i]);
    }
    let result = this.hierarhySort(hashArr, 0, []);
    return result;
  }

  private getColorState(state) {

    let statecolor = this.getStateColor(state);
    let backgroundcolor = statecolor;
    if (state === "Removed") {
      backgroundcolor = "transparent";
    }
    return "<span class=\"workitem-state-circle\" style=\"padding:0;border-color:" + statecolor + ";background-color:" + backgroundcolor + "\"></span>";
  }

  private getName(name, id, disabled = false) {
    if (disabled) {
      return "<div id=\"linkwidisabled\" >" + name + "</div>";
    }
    return "<div id=\"linkwi\" dataid=" + id + ">" + name + "</div>";
  }

  // renvoie la hierarchy en tableau
  private GetWIHierarchy(wiParent: number[], customSettings): IPromise<any> {
    let deferred = $.Deferred<any>();
    this.clientwi.getWorkItems(wiParent, undefined, undefined, WorkItemsContracts.WorkItemExpand.All).then(r => {
      let current = r[0];
      let childs = current.relations;
      this.data = [];
      this.data.push({
        "id": current.fields["System.Id"],
        "name": current.fields["System.Title"],
        "state": current.fields["System.State"],
        "parentid": 0,
        "wiindex": 0,
        "witype": current.fields["System.WorkItemType"]
      });
      if (childs !== undefined) {
        this.getTabChilds(childs, wiParent[0]).then(childst => {
          childst.forEach((c) => {
            this.data.push(c);
          });
          deferred.resolve(this.data);
        });
      } else {
        deferred.resolve(this.data);
      }
    });
    return deferred.promise();
  }

  // parcours et compose la liste des childs
  private getTabChilds(childs: any, parentid: number): IPromise<[]> {
    this.wiIndex++;
    let deferred = $.Deferred<any>();
    let childTabs = [];
    let promise_widetails = childs.map(element => {
      if (element.rel === "System.LinkTypes.Hierarchy-Forward") {
        let deferred1 = $.Deferred<any>();
        let deferred2 = $.Deferred<any>();
        this.getWorkItem(element.url).then(wi => { // rcupere le detail du wi
          childTabs.push({
            "id": wi.id,
            "name": wi.fields["System.Title"],
            "state": wi.fields["System.State"],
            "parentid": parentid,
            "wiindex": this.wiIndex,
            "witype": wi.fields["System.WorkItemType"]
          });
          deferred1.resolve(wi);
          return deferred1.promise();
        }).then(r => {

          this.getTabChilds(r.relations, r.id).then(childst => {
            childst.forEach((c) => {
              childTabs.push(c);
            });
            deferred2.resolve(childTabs);
          });
        });
        return deferred2.promise();
      }
    });
    Q.all(promise_widetails).then((res) => {
      deferred.resolve(childTabs);
    });
    return deferred.promise();
  }

  // retourne le detail d'un WI
  private getWorkItem(uri: string): IPromise<any> {
    let deferred = $.Deferred<any>();
    let authTokenManager = Services.authTokenManager;
    VSS.getAccessToken().then((token) => {
      let header = authTokenManager.getAuthorizationHeader(token);
      $.ajaxSetup({
        headers: { "Authorization": header }
      });
      $.ajax({
        url: uri + "?%24expand=4",
        type: "GET",
        dataType: "json",
        success: c => {
          deferred.resolve(c);
        }
      });
    });
    return deferred.promise();
  }

  // rajoute une Row au Table
  private appendTableColumn(table, rowData, wiId, parentId) {
    let lastRow;
    lastRow = $("<tr/>").appendTo(table.find("tbody:last"));
    $.each(rowData, function (colIndex, c) {
      if (parentId !== 0) {
        lastRow.attr({
          "data-tt-parent-id": parentId,
          "data-tt-id": wiId
        });
      } else {
        lastRow.attr("data-tt-id", wiId);
      }
      lastRow.append($("<td/>").html(c));
    });
    return lastRow;
  }

  // methode de trie du tableu final
  private hierarchySortFunc(a, b) {
    // return a.id - b.id; // pour trier sur l'id
    // pour trier sur le nom
    let x = a.name.toLowerCase();
    let y = b.name.toLowerCase();
    if (x < y) { return -1; }
    if (x > y) { return 1; }
    return 0;
  }

  // methode qui renvoi le tableau final
  private hierarhySort(hashArr, key, result) {
    if (hashArr[key] === undefined) {
      return;
    }
    let arr = hashArr[key].sort(this.hierarchySortFunc);

    for (let i = 0; i < arr.length; i++) {
      result.push(arr[i]);
      this.hierarhySort(hashArr, arr[i].id, result);
    }
    return result;
  }

  private getStateColor(state: string): string {
    let statecolor = "";
    switch (state) {

      case "Approved":
      case "New":
      case "To Do":
      case "Design":
        statecolor = "#b2b2b2";
        break;
      case "In Progress":
      case "Committed":
      case "Open":
      case "Ready":
      case "Active":
      case "In Planning":
        statecolor = "#007acc";
        break;
      case "Done":
      case "Closed":
      case "Inactive":
      case "Completed":
        statecolor = "#393";
        break;
      case "Removed":
        statecolor = "#5688e0";
        break;
      default:
        statecolor = "#b2b2b2";

    }

    return statecolor;
  }

  private getWiTypes(): IPromise<any> {
    let deferred = $.Deferred<any>();
    let projectid = VSS.getWebContext().project.id;
    this.clientwi.getWorkItemTypes(projectid).then(r => {
      deferred.resolve(r);
    });
    return deferred.promise();
  }

  // Load and Reload Methods
  public load(widgetSettings) {
    return this.LoadWidget(widgetSettings, false);
  }
  public reload(widgetSettings) {
    return this.LoadWidget(widgetSettings, true);
  }

}

VSS.require("TFS/Dashboards/WidgetHelpers", function (WidgetHelpers) {
  WidgetHelpers.IncludeWidgetStyles();
  VSS.register("backlogitemhierarchy", () => {
    let hierarchy = new BacklogItemHierarchyWidget(WidgetHelpers);
    return hierarchy;
  });
  VSS.notifyLoadSucceeded();
});
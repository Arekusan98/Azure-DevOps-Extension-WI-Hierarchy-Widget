"use strict";
import Services = require("VSS/Authentication/Services");

export class WiMenu {
    constructor() { }

    public dashboards: any;

    public getDashboards(): IPromise<any[]> {
        let deferred = $.Deferred<any>();
        let authTokenManager = Services.authTokenManager;
        VSS.getAccessToken().then(function (token) {
            let header = authTokenManager.getAuthorizationHeader(token);
            $.ajaxSetup({
                headers: { "Authorization": header }
            });

            let collectionUri = VSS.getWebContext().collection.uri;
            $.ajax({
                url: collectionUri + VSS.getWebContext().project.id + "/" + VSS.getWebContext().team.id + "/_apis/dashboard/dashboards",
                type: "GET",
                dataType: "json",
                data: `api-version=4.0-preview.2`,
                success: c => {
                    console.log(c.dashboardEntries);
                    deferred.resolve(c.dashboardEntries);

                },
                error: e => {
                }
            });

        });
        return deferred.promise();
    }

    public getDashboard(dashboardId): IPromise<any> {
        let deferred = $.Deferred<any>();
        let authTokenManager = Services.authTokenManager;
        VSS.getAccessToken().then(function (token) {
            let header = authTokenManager.getAuthorizationHeader(token);
            $.ajaxSetup({
                headers: { "Authorization": header }
            });

            let collectionUri = VSS.getWebContext().collection.uri;
            $.ajax({
                url: collectionUri + VSS.getWebContext().project.id + "/" + VSS.getWebContext().team.id + "/_apis/dashboard/dashboards/" + dashboardId,
                type: "GET",
                dataType: "json",
                data: `api-version=4.0-preview.2`,
                success: c => {
                    deferred.resolve(c);
                },
                error: e => {
                }
            });

        });
        return deferred.promise();
    }

    public addWidgetToDashboard(dashboardid: string, parentwiid: string) {
        let deferred = $.Deferred<any>();
        let authTokenManager = Services.authTokenManager;
        VSS.getAccessToken().then(function (token) {
            let header = authTokenManager.getAuthorizationHeader(token);
            $.ajaxSetup({
                headers: { "Authorization": header }
            });
            let w = new WiMenu();
            w.getDashboard(dashboardid).then((dashboard) => {

                let Widgetobj = {
                    "name": "Backlog Item Hierarchy", "position": { "row": 0, "column": 0 }, "size": { "rowSpan": 2, "columnSpan": 3 }, "settings": "{\"wiId\":\"" + parentwiid + "\",\"expandtree\":false}", "settingsVersion": { "major": 1, "minor": 0, "patch": 0 }, "dashboard": { "eTag": "" + dashboard.eTag + "" }, "contributionId": "" + VSS.getExtensionContext().publisherId + "." + VSS.getExtensionContext().extensionId + ".backlogitemhierarchy"
                };
                let toSend = JSON.stringify(Widgetobj);
                let collectionUri = VSS.getWebContext().collection.uri;

                $.ajax({
                    url: collectionUri + VSS.getWebContext().project.id + "/" + VSS.getWebContext().team.id + "/_apis/dashboard/dashboards/" + dashboardid + "/widgets?api-version=4.0-preview.2",
                    type: "POST",
                    dataType: "json",
                    contentType: "application/json; charset=utf-8",
                    data: toSend,
                    success: c => {
                        console.log("BacklogItemHierarchyWidget: WI " + parentwiid + " is added to Dashboard " + dashboard.name);
                        deferred.resolve(c);
                    },
                    error: e => {
                    }
                });

            });
        });
        return deferred.promise();
    }
}

let contributionId = VSS.getExtensionContext().publisherId + "." + VSS.getExtensionContext().extensionId + ".addToDashboard-backlogitemhierarchy-menu";
VSS.register(contributionId, {

    getMenuItems: (context) => {

        // Not all areas use the same format for passing work item ids. "ids" for Queries
        // "workItemIds" for backlogs
        let ids = context.ids || context.workItemIds;
        if (!ids && context.id) {
            // Boards only support a single work item
            ids = [context.id];
        }

        let calledWithActiveForm = false;

        if (!ids && context.workItemId) {
            // Work item form menu
            ids = [context.workItemId];
            calledWithActiveForm = true;
        }

        let childItems: IContributedMenuItem[] = [];

        let w = new WiMenu();
        return w.getDashboards().then((dashboards) => {
            dashboards.forEach((dashboard) => {
                childItems.push(<IContributedMenuItem>{
                    text: dashboard.name,
                    title: dashboard.name,
                    action: () => {
                        ids.forEach((value, index) => {
                            w.addWidgetToDashboard(dashboard.id, value).then(() => { });
                        });
                    }
                });

            });

            return [<IContributedMenuItem>{
                "text": "Pin backlog item hierarchy to dashboard",
                title: "Pin backlog item hierarchy to dashboard",
                icon: "static/images/adddashboard.png",
                childItems: childItems
            }];

        });
    }

});

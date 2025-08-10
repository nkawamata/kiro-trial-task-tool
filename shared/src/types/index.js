"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectRole = exports.TaskPriority = exports.TaskStatus = exports.ProjectStatus = void 0;
var ProjectStatus;
(function (ProjectStatus) {
    ProjectStatus["PLANNING"] = "planning";
    ProjectStatus["ACTIVE"] = "active";
    ProjectStatus["ON_HOLD"] = "on_hold";
    ProjectStatus["COMPLETED"] = "completed";
    ProjectStatus["CANCELLED"] = "cancelled";
})(ProjectStatus || (exports.ProjectStatus = ProjectStatus = {}));
var TaskStatus;
(function (TaskStatus) {
    TaskStatus["TODO"] = "todo";
    TaskStatus["IN_PROGRESS"] = "in_progress";
    TaskStatus["IN_REVIEW"] = "in_review";
    TaskStatus["DONE"] = "done";
    TaskStatus["BLOCKED"] = "blocked";
})(TaskStatus || (exports.TaskStatus = TaskStatus = {}));
var TaskPriority;
(function (TaskPriority) {
    TaskPriority["LOW"] = "low";
    TaskPriority["MEDIUM"] = "medium";
    TaskPriority["HIGH"] = "high";
    TaskPriority["URGENT"] = "urgent";
})(TaskPriority || (exports.TaskPriority = TaskPriority = {}));
var ProjectRole;
(function (ProjectRole) {
    ProjectRole["OWNER"] = "owner";
    ProjectRole["ADMIN"] = "admin";
    ProjectRole["MEMBER"] = "member";
    ProjectRole["VIEWER"] = "viewer";
})(ProjectRole || (exports.ProjectRole = ProjectRole = {}));

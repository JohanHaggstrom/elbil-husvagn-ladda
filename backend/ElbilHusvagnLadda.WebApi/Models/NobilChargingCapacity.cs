namespace ElbilHusvagnLadda.WebApi.Models;

// NOBIL attrvalid IDs for "Charging capacity" (attribute 5).
// Source: NOBIL API attribute documentation. If NOBIL changes these IDs,
// the mapping must be updated.
public enum NobilChargingCapacityId
{
    V230_1P_16A = 7,
    V230_1P_32A = 8,
    V230_3P_16A = 29,
    V230_3P_32A = 30,
    V400_3P_16A = 27,
    V400_3P_32A = 28,
    V400_3P_63A = 31,
}

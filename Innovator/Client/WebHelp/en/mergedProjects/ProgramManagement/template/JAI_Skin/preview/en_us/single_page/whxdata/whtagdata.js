(function() {
var tagCombinations =  [["$"],["Others:UK"],["Others:US"],["Others:Canada"]] ,
  tags =  [{"display":"Country","type":"group","children":[{"name":"Others:US","display":"US"},{"name":"Others:Canada","display":"Canada"},{"name":"Others:UK","display":"UK"}]}],
  caption = "Select one country",
  type = "radio",
  defFilter = null;

window.rh.model.publish("p.tag_combinations", tagCombinations, { sync:true });
window.rh.model.publish("temp.data", {"tags": tags, "caption": caption, "type": type , "default": defFilter}, { sync:true });
})();

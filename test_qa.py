def get_val(g, nested_key, sub_key, flat_key):
    nested = g.get(nested_key)
    if isinstance(nested, dict):
        return nested.get(sub_key)
    return g.get(flat_key)

group = {'group': {'ref_area': 'GHA', 'ref_area_name': 'Ghana'}}
print("ref_area_name:", get_val(group, "group", "ref_area_name", "ref_area_name"))
print("ref_area:", get_val(group, "group", "ref_area", "ref_area"))

country_name = (
    get_val(group, "group", "ref_area_name", "ref_area_name")
    or get_val(group, "group", "ref_area", "ref_area")
    or ""
)
print("country_name:", country_name)

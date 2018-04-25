<?php
class Database_Model extends CI_Model {
	
	function __construct() {
			parent ::__construct();
	}
	
	public function insert_data($table,$data)
	{
		if($this->db->insert($table,$data)){
		return $this->db->insert_id(); // eklenen kaydın Id sini  gönderir
		}
	}

	public function update_data($table,$data,$id)
	{
		$this->db->where("ID",$id);
		$this->db->update($table,$data);
		return true;
	}
	public function urunler_get()
	{
		$query =$this->db->query('SELECT turu.adi as turadi, kategoriler.adi as katadi, urunler.* FROM urunler LEFT JOIN turu ON urunler.turu=turu.Id LEFT JOIN kategoriler ON urunler.kategori_id=kategoriler.Id');
		
		return $query->result();
	}
	
	
		public function urun_get($id)
	{
		$query =$this->db->query('SELECT turu.adi as turadi, kategoriler.adi as katadi, urunler.* FROM urunler LEFT JOIN turu ON urunler.turu=turu.Id LEFT JOIN kategoriler ON urunler.kategori_id=kategoriler.Id WHERE urunler.Id='.$id);
		
		return $query->result();
	}
	public function urunadi_get($id)
	{
		$query =$this->db->query('SELECT urunler.adi as urunadi, urunler.* FROM urunler LEFT JOIN yorumlar ON urun_id=urunler.Id WHERE yorumlar.Id='.$id);
		
		return $query->result();
	}
	

	public function get_kategori($id){
		$sql="SELECT turu.adi as turadi, kategoriler.adi as katadi, urunler.* 
		FROM urunler
		LEFT JOIN turu ON urunler.turu=turu.Id
		LEFT JOIN kategoriler ON urunler.kategori_id=kategoriler.Id WHERE urunler.kategori_id=".$id ;
		;
		$query=$this->db->query($sql);
		return $query->result();
	}
	public function get_marka($id){
		$sql="SELECT turu.adi as turadi, kategoriler.adi as katadi, urunler.* 
		FROM urunler
		LEFT JOIN turu ON urunler.turu=turu.Id
		LEFT JOIN kategoriler ON urunler.kategori_id=kategoriler.Id WHERE urunler.turu=".$id ;
		;
		$query=$this->db->query($sql);
		return $query->result();
	}

	
	
}
<?php
defined('BASEPATH') OR exit('No direct script access allowed');

class Mesajlar extends CI_Controller {

	function __construct()
	{
		parent :: __construct();
		$this->load->library('session');
		$this->load->helper('url');
		$this->load->database();
		$this->load->library('session');
		$this->load->model('Database_Model');
		if(! $this->session->userdata('oturum_data')){
		redirect(base_url().'admin/login');}
	} 
	public function index()
	{	
	    $data['sayfa']='Gelen Mesajlarım' ;	
		$query=$this->db->get("mesajlar");
		$data["veri"]=$query->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/mesaj_listesi',$data);
		$this->load->view('admin/footer');
		
		
	}
		public function gonderilmis_m()
	{	$data['sayfa']='Gönderilen Mesajlarım' ;		
		$query=$this->db->get("g_mesajlar");
		$data["veri"]=$query->result();
	    $this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/g_mesaj_listesi',$data);
		$this->load->view('admin/footer');
		
		
	}
	public function mesaj_yaz($id)
	{	$data['sayfa']='Mesaj Yaz'; 	
	    $sorgu=$this->db->query("SELECT * FROM mesajlar WHERE ID=$id");
		$data["veri"]=$sorgu->result();
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$this->load->view('admin/mesaj_yaz',$data);
		$this->load->view('admin/footer');
		
		
	}
		public function mesaj_ekle()
	{
		
		$data=array(
		    'adsoy'=> $this->input->post('adsoy'),
			'email'=> $this->input->post('email'),
			'konu'=> $this->input->post('konu'),
			'mesaj'=> $this->input->post('mesaj'),
			);
			$this->Database_Model->insert_data("g_mesajlar",$data);
			$this->Database_Model->insert_data("g_mesajlar_uye",$data);
			$this->session->set_flashdata("sonuc", "Mesajınız başarı ile iletilmiştir.");
			
		redirect (base_url()."admin/mesajlar");
	} 


	public function delete($id)
	{		
		$this->db->query("DELETE FROM mesajlar WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."admin/mesajlar");
			
		
		
	}
	public function g_delete($id)
	{		
		$this->db->query("DELETE FROM g_mesajlar WHERE Id=$id");
		$this->session->set_flashdata('sonuc','Silme  işlemi başarılıdır!');
		redirect (base_url()."admin/mesajlar/gonderilmis_m");
			
		
		
	}
	public function detay($id)
	{   $data['sayfa']='Mesaj Detay';
		$this->db->query("UPDATE mesajlar SET durum='okundu' WHERE durum='yeni'AND Id=$id");
		$this->load->view('admin/header',$data);
		$this->load->view('admin/leftside');
		$sorgu=$this->db->query("SELECT * FROM mesajlar WHERE ID=$id");
		$data["veri"]=$sorgu->result();
		$this->load->view('admin/mesaj_detay',$data);
		$this->load->view('admin/footer');
			
	}
	public function guncellekaydet($id)
	{		
		$data=array(
		    'durum'  => $this->input->post('durum'),
			'adminnotu'  => $this->input->post('adminnotu')
			
			);
			$this->Database_Model->update_data("mesajlar",$data,$id);
			$this->session->set_flashdata('sonuc','Notunuz kaydedildi!');
			redirect (base_url()."admin/mesajlar/detay/$id");
			
		
		
	}
}
